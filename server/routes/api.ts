// API routes for likes, comments, newsletter, and feedback
// Uses PostgreSQL directly for persistence

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://blog_user:piVdLYWqbtZyfWo2VkcY2QFC9lVjXbde@localhost:5432/blog_db';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama-service:11434';

const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('Blog API: PostgreSQL connected'))
    .catch(err => console.error('Blog API: PostgreSQL connection failed:', err.message));

/**
 * Moderate a comment using Ollama LLM
 * Returns { isHarmful: boolean, reason?: string }
 */
async function moderateComment(content: string, authorName: string): Promise<{ isHarmful: boolean; reason?: string }> {
    try {
        const prompt = `You are a content moderator. Analyze the following blog comment and determine if it contains harmful, offensive, degrading, spam, or inappropriate content.

Comment by "${authorName}":
"${content}"

Respond with ONLY a JSON object in this exact format:
{"harmful": true/false, "reason": "brief explanation if harmful, empty string if not"}

Be strict about: hate speech, harassment, threats, spam, explicit content, personal attacks, or discriminatory language.
Be lenient about: constructive criticism, mild disagreement, casual language.`;

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma3:12b',
                prompt,
                stream: false,
                options: { temperature: 0.1 }
            })
        });

        if (!response.ok) {
            console.error('Ollama moderation failed:', response.status);
            return { isHarmful: false }; // Fail open - allow comment if moderation fails
        }

        const data = await response.json() as { response: string };
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return { isHarmful: result.harmful === true, reason: result.reason || '' };
        }

        return { isHarmful: false };
    } catch (error) {
        console.error('Comment moderation error:', error);
        return { isHarmful: false }; // Fail open
    }
}

export async function apiRouter(req: Request, path: string): Promise<Response> {
    const method = req.method;

    // Newsletter subscription
    if (path === "/api/newsletter" && method === "POST") {
        try {
            const body = await req.json() as { email: string };
            console.log('Newsletter signup:', body.email);
            return json({ message: 'Subscribed successfully!' });
        } catch (error) {
            console.error('Newsletter error:', error);
            return json({ error: 'Failed to subscribe' }, 500);
        }
    }

    // Post likes - match path pattern
    const likesMatch = path.match(/^\/api\/posts\/([^/]+)\/likes$/);
    if (likesMatch) {
        const postId = likesMatch[1];

        if (method === "GET") {
            try {
                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
                    [postId]
                );
                return json({ count: parseInt(result.rows[0]?.count || '0', 10) });
            } catch (error) {
                console.error('Likes GET error:', error);
                return json({ count: 0 });
            }
        }

        if (method === "POST") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientId = body.clientId || 'anonymous';

                await pool.query(
                    `INSERT INTO likes (post_id, user_id) VALUES ($1, $2)
                     ON CONFLICT (post_id, user_id) DO NOTHING`,
                    [postId, clientId]
                );

                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
                    [postId]
                );
                return json({ count: parseInt(result.rows[0]?.count || '0', 10), liked: true });
            } catch (error) {
                console.error('Likes POST error:', error);
                return json({ error: 'Failed to like post' }, 500);
            }
        }

        if (method === "DELETE") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientId = body.clientId || 'anonymous';

                await pool.query(
                    'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
                    [postId, clientId]
                );

                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
                    [postId]
                );
                return json({ count: parseInt(result.rows[0]?.count || '0', 10), liked: false });
            } catch (error) {
                console.error('Unlike error:', error);
                return json({ error: 'Failed to unlike post' }, 500);
            }
        }
    }

    // Comment summary - GET /api/posts/:id/summary
    const summaryMatch = path.match(/^\/api\/posts\/([^/]+)\/summary$/);
    if (summaryMatch && method === "GET") {
        const postId = summaryMatch[1];
        try {
            const result = await pool.query(
                `SELECT summary_text, comment_count, updated_at
                 FROM comment_summaries WHERE post_id = $1`,
                [postId]
            );
            if (result.rows.length === 0) {
                return json({ summary: null });
            }
            return json({
                summary: result.rows[0].summary_text,
                commentCount: result.rows[0].comment_count,
                updatedAt: result.rows[0].updated_at
            });
        } catch (error) {
            console.error('Summary GET error:', error);
            return json({ summary: null });
        }
    }

    // Post comments - match path pattern
    const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (commentsMatch) {
        const postId = commentsMatch[1];

        if (method === "GET") {
            try {
                // Only return approved comments
                const result = await pool.query(
                    `SELECT id, content, author_name as display_name, created_at
                     FROM comments
                     WHERE post_id = $1 AND (approved = TRUE OR approved IS NULL)
                     ORDER BY created_at DESC`,
                    [postId]
                );
                return json({
                    comments: result.rows,
                    total: result.rows.length
                });
            } catch (error) {
                console.error('Comments GET error:', error);
                return json({ comments: [], total: 0 });
            }
        }

        if (method === "POST") {
            try {
                const body = await req.json() as { name?: string; comment: string };
                const authorName = body.name?.trim() || 'Anonymous';
                const content = body.comment?.trim();

                if (!content) {
                    return json({ error: 'Comment content is required' }, 400);
                }

                // Insert comment as approved initially
                const result = await pool.query(
                    `INSERT INTO comments (post_id, content, author_name, approved)
                     VALUES ($1, $2, $3, TRUE)
                     RETURNING id, content, author_name as display_name, created_at`,
                    [postId, content, authorName]
                );

                const commentId = result.rows[0].id;

                // Run moderation asynchronously (don't block the response)
                moderateComment(content, authorName).then(async (modResult) => {
                    if (modResult.isHarmful) {
                        console.log(`Comment ${commentId} flagged as harmful: ${modResult.reason}`);
                        await pool.query(
                            `UPDATE comments SET approved = FALSE, moderation_reason = $1 WHERE id = $2`,
                            [modResult.reason, commentId]
                        );
                    }
                }).catch(err => console.error('Async moderation failed:', err));

                return json(result.rows[0], 201);
            } catch (error) {
                console.error('Comments POST error:', error);
                return json({ error: 'Failed to post comment' }, 500);
            }
        }
    }

    // Feedback
    if (path === "/api/feedback" && method === "POST") {
        try {
            const body = await req.json() as { name?: string; message: string; feedbackType?: string; rating?: number };
            console.log('Feedback received:', body);
            return json({ message: 'Feedback received! Thank you.' });
        } catch (error) {
            console.error('Feedback error:', error);
            return json({ error: 'Failed to submit feedback' }, 500);
        }
    }

    return json({ error: "Not found" }, 404);
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
}
