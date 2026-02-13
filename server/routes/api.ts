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
            const email = body.email?.trim().toLowerCase();

            if (!email || !email.includes('@')) {
                return json({ error: 'Valid email is required' }, 400);
            }

            // Check if email already exists
            const existing = await pool.query(
                'SELECT email, status FROM newsletter_subscribers WHERE email = $1',
                [email]
            );

            if (existing.rows.length > 0) {
                const subscriber = existing.rows[0];
                if (subscriber.status === 'active') {
                    console.log('Newsletter: Already subscribed:', email);
                    return json({ message: "You're already subscribed!" });
                } else {
                    // Reactivate if previously unsubscribed
                    await pool.query(
                        'UPDATE newsletter_subscribers SET status = $1, subscribed_at = NOW() WHERE email = $2',
                        ['active', email]
                    );
                    console.log('Newsletter: Reactivated subscription:', email);
                    return json({ message: 'Welcome back! Subscription reactivated.' });
                }
            }

            // Insert new subscriber
            await pool.query(
                'INSERT INTO newsletter_subscribers (email, status) VALUES ($1, $2)',
                [email, 'active']
            );

            console.log('Newsletter: New signup:', email);
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

                // Check if already liked, then insert
                const existing = await pool.query(
                    'SELECT id FROM likes WHERE post_id = $1 AND client_id = $2::uuid',
                    [postId, clientId]
                );
                if (existing.rows.length === 0) {
                    await pool.query(
                        'INSERT INTO likes (post_id, client_id) VALUES ($1, $2::uuid)',
                        [postId, clientId]
                    );
                }

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
                    'DELETE FROM likes WHERE post_id = $1 AND client_id = $2::uuid',
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
                    `SELECT id, content, display_name, created_at
                     FROM comments
                     WHERE post_id = $1 AND status = 'approved'
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
                const body = await req.json() as { name?: string; comment: string; clientId?: string };
                const authorName = body.name?.trim() || 'Anonymous';
                const content = body.comment?.trim();
                const clientId = body.clientId || null;

                if (!content) {
                    return json({ error: 'Comment content is required' }, 400);
                }

                // Insert comment as approved initially with client_id for future updates
                const result = await pool.query(
                    `INSERT INTO comments (post_id, content, display_name, status, client_id)
                     VALUES ($1, $2, $3, 'approved', $4::uuid)
                     RETURNING id, content, display_name, created_at`,
                    [postId, content, authorName, clientId]
                );

                const commentId = result.rows[0].id;

                // Run moderation asynchronously (don't block the response)
                moderateComment(content, authorName).then(async (modResult) => {
                    if (modResult.isHarmful) {
                        console.log(`Comment ${commentId} flagged as harmful: ${modResult.reason}`);
                        await pool.query(
                            `UPDATE comments SET status = 'rejected' WHERE id = $1`,
                            [commentId]
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

    // Update display name for all user's comments
    if (path === "/api/update-display-name" && method === "POST") {
        try {
            const body = await req.json() as { clientId: string; newDisplayName: string };
            const clientId = body.clientId?.trim();
            const newDisplayName = body.newDisplayName?.trim();

            if (!clientId || !newDisplayName) {
                return json({ error: 'clientId and newDisplayName are required' }, 400);
            }

            // Update all comments by this client_id to use the new display name
            const result = await pool.query(
                `UPDATE comments
                 SET display_name = $1
                 WHERE client_id = $2::uuid AND status = 'approved'
                 RETURNING id`,
                [newDisplayName, clientId]
            );

            const updatedCount = result.rows.length;
            console.log(`Updated ${updatedCount} comments for client ${clientId} to "${newDisplayName}"`);

            return json({
                success: true,
                updatedCount,
                message: `Updated ${updatedCount} comment(s) to "${newDisplayName}"`
            });
        } catch (error) {
            console.error('Update display name error:', error);
            return json({ error: 'Failed to update display name' }, 500);
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

    // Generate creative display name using Ollama
    if (path === "/api/generate-name" && method === "GET") {
        try {
            const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma3:12b',
                    prompt: 'Generate a creative, unique username using an adjective and an animal name. Format: Adjective-Animal-5DigitNumber. Examples: Swift-Falcon-78294, Clever-Otter-23415, Brave-Lynx-91827, Mystic-Phoenix-45621, Silent-Leopard-64918. Output ONLY the username in that exact format, nothing else.',
                    stream: false,
                    options: { temperature: 0.9 }
                })
            });

            if (!ollamaResponse.ok) {
                console.error('Ollama name generation failed:', ollamaResponse.status);
                return json({ error: 'Generation failed' }, 500);
            }

            const ollamaData = await ollamaResponse.json() as { response: string };
            const generatedName = ollamaData.response.trim();

            // Validate format (Adjective-Animal-Number)
            const namePattern = /^[A-Z][a-z]+-[A-Z][a-z]+-\d{5}$/;
            if (!namePattern.test(generatedName)) {
                console.error('Invalid name format from Ollama:', generatedName);
                return json({ error: 'Invalid format' }, 500);
            }

            return json({ name: generatedName });
        } catch (error) {
            console.error('Name generation error:', error);
            return json({ error: 'Generation failed' }, 500);
        }
    }

    // Telemetry - In-house analytics
    if (path === "/api/telemetry" && method === "POST") {
        try {
            const body = await req.json() as {
                sessionId: string;
                userId: string;
                userAgent?: string;
                viewport?: { width: number; height: number };
                events: Array<{
                    name: string;
                    timestamp: string;
                    data: Record<string, unknown>;
                }>;
            };

            // Upsert session (create if not exists, update last_seen_at if exists)
            await pool.query(
                `INSERT INTO user_sessions (id, user_id, user_agent, viewport_width, viewport_height, last_seen_at)
                 VALUES ($1::uuid, $2, $3, $4, $5, NOW())
                 ON CONFLICT (id) DO UPDATE SET last_seen_at = NOW()`,
                [
                    body.sessionId,
                    body.userId,
                    body.userAgent || null,
                    body.viewport?.width || null,
                    body.viewport?.height || null
                ]
            );

            // Insert events
            if (body.events && body.events.length > 0) {
                for (const event of body.events) {
                    if (event.name === 'page_view') {
                        // Insert into page_views table
                        await pool.query(
                            `INSERT INTO page_views (session_id, url, title, referrer, viewed_at)
                             VALUES ($1::uuid, $2, $3, $4, $5::timestamp)`,
                            [
                                body.sessionId,
                                event.data.url || '',
                                event.data.title || '',
                                event.data.referrer || '',
                                event.timestamp
                            ]
                        );
                    } else {
                        // Insert into events table
                        await pool.query(
                            `INSERT INTO events (session_id, event_name, event_data, created_at)
                             VALUES ($1::uuid, $2, $3, $4::timestamp)`,
                            [
                                body.sessionId,
                                event.name,
                                event.data,
                                event.timestamp
                            ]
                        );
                    }
                }
            }

            return json({ success: true });
        } catch (error) {
            console.error('Telemetry error:', error);
            // Fail silently - don't break user experience
            return json({ success: false }, 200);
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
