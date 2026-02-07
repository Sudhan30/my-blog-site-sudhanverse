// API routes for likes, comments, newsletter, and feedback
// Uses PostgreSQL directly for persistence

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://blog_user:piVdLYWqbtZyfWo2VkcY2QFC9lVjXbde@localhost:5432/blog_db';

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

export async function apiRouter(req: Request, path: string): Promise<Response> {
    const method = req.method;

    // Newsletter subscription
    if (path === "/api/newsletter" && method === "POST") {
        try {
            const body = await req.json() as { email: string };
            // For now, just log it - can add newsletter table later
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

                // Insert like (ignore if already exists due to unique constraint)
                await pool.query(
                    `INSERT INTO likes (post_id, user_id) VALUES ($1, $2)
                     ON CONFLICT (post_id, user_id) DO NOTHING`,
                    [postId, clientId]
                );

                // Get updated count
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

                // Remove like
                await pool.query(
                    'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
                    [postId, clientId]
                );

                // Get updated count
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

    // Post comments - match path pattern
    const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (commentsMatch) {
        const postId = commentsMatch[1];

        if (method === "GET") {
            try {
                const result = await pool.query(
                    `SELECT id, content, author_name as display_name, created_at
                     FROM comments WHERE post_id = $1
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

                const result = await pool.query(
                    `INSERT INTO comments (post_id, content, author_name)
                     VALUES ($1, $2, $3)
                     RETURNING id, content, author_name as display_name, created_at`,
                    [postId, content, authorName]
                );

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
            // Log feedback for now
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
