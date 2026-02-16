// API routes for likes, comments, newsletter, and feedback
// Uses PostgreSQL directly for persistence

import { Pool } from 'pg';
import { secureJson } from '../middleware/security';

const DATABASE_URL = process.env.DATABASE_URL;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama-service:11434';
const GOTIFY_URL = process.env.GOTIFY_URL || 'http://gotify-service.web:80';
const GOTIFY_TOKEN = process.env.GOTIFY_TOKEN;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable must be set');
}

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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma3:12b',
                prompt,
                stream: false,
                options: { temperature: 0.1 }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`❌ Ollama moderation failed: ${response.status} ${response.statusText}`);
            return { isHarmful: false }; // Fail open - allow comment if moderation fails
        }

        const data = await response.json() as { response: string };
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            const isHarmful = result.harmful === true;
            console.log(`✓ Moderation complete: isHarmful=${isHarmful}, reason="${result.reason || 'none'}"`);
            return { isHarmful, reason: result.reason || '' };
        }

        console.error('❌ Moderation response parsing failed - no JSON found in response');
        return { isHarmful: false };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('❌ Moderation timeout after 20s');
        } else {
            console.error('❌ Moderation error:', error);
        }
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
                // Parse pagination and sorting params from URL
                const url = new URL(req.url);
                const page = parseInt(url.searchParams.get('page') || '1', 10);
                const limit = parseInt(url.searchParams.get('limit') || '10', 10);
                const offset = (page - 1) * limit;
                const sort = url.searchParams.get('sort') || 'recent'; // recent, oldest, most_liked
                const clientId = url.searchParams.get('clientId') || null;

                // Determine ORDER BY clause based on sort
                let orderBy = 'created_at DESC';
                if (sort === 'oldest') {
                    orderBy = 'created_at ASC';
                } else if (sort === 'most_liked') {
                    orderBy = 'like_count DESC, created_at DESC';
                }

                // Get total count
                const countResult = await pool.query(
                    `SELECT COUNT(*) as total
                     FROM comments
                     WHERE post_id = $1 AND status = 'approved'`,
                    [postId]
                );
                const total = parseInt(countResult.rows[0]?.total || '0', 10);

                // Get paginated comments with like counts
                const query = `SELECT
                        c.id,
                        c.content,
                        c.display_name,
                        c.created_at,
                        COUNT(cl.id) as like_count,
                        ${clientId ? `EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND client_id = $4::uuid) as user_liked` : 'false as user_liked'}
                     FROM comments c
                     LEFT JOIN comment_likes cl ON c.id = cl.comment_id
                     WHERE c.post_id = $1 AND c.status = 'approved'
                     GROUP BY c.id
                     ORDER BY ${orderBy}
                     LIMIT $2 OFFSET $3`;
                const params = clientId ? [postId, limit, offset, clientId] : [postId, limit, offset];

                const result = await pool.query(query, params);

                return json({
                    comments: result.rows.map(row => ({
                        id: row.id,
                        content: row.content,
                        display_name: row.display_name,
                        created_at: row.created_at,
                        like_count: parseInt(row.like_count, 10),
                        user_liked: row.user_liked
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasMore: offset + result.rows.length < total
                    }
                });
            } catch (error) {
                console.error('❌ Comments GET error:', error);
                return json({ comments: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false } });
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

                // Check if display name is already taken by another user (case-insensitive)
                if (authorName !== 'Anonymous' && clientId) {
                    const nameCheck = await pool.query(
                        `SELECT client_id FROM comments
                         WHERE LOWER(display_name) = LOWER($1) AND client_id != $2::uuid
                         LIMIT 1`,
                        [authorName, clientId]
                    );
                    if (nameCheck.rows.length > 0) {
                        return json({ error: 'This display name is already taken by another user' }, 409);
                    }
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

            // Check if display name is already taken by another user (case-insensitive)
            const nameCheck = await pool.query(
                `SELECT client_id FROM comments
                 WHERE LOWER(display_name) = LOWER($1) AND client_id != $2::uuid
                 LIMIT 1`,
                [newDisplayName, clientId]
            );
            if (nameCheck.rows.length > 0) {
                return json({ error: 'This display name is already taken by another user' }, 409);
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

            // Send Gotify notification
            if (GOTIFY_TOKEN) {
                const name = body.name || 'Anonymous';
                const rating = body.rating ? `⭐️ Rating: ${body.rating}/5\n` : '';
                const feedbackType = body.feedbackType ? `Type: ${body.feedbackType}\n` : '';

                fetch(`${GOTIFY_URL}/message?token=${GOTIFY_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `📝 New Feedback from ${name}`,
                        message: `${rating}${feedbackType}\n${body.message}`,
                        priority: 5
                    })
                }).catch(err => console.error('Gotify notification failed:', err));
            }

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
                    prompt: `Generate ONE highly creative and unique username in the format Word-Word-5DigitNumber

Uniqueness is the highest priority.

Core style:
- Blend mythological, cosmic, or legendary vibes with modern username style
- Draw inspiration from global mythologies (Greek, Norse, Hindu, Egyptian, Mesopotamian)
- Do NOT simply output famous god names
- You may INVENT new myth-sounding words inspired by mythology
- Prefer rare, evocative, and pronounceable words

Rules:
- Do NOT rely on a fixed adjective or animal list unless necessary
- Avoid common internet username clichés
- Avoid overused animals like fox, wolf, tiger unless no other option works
- The two words should feel stylistically coherent and slightly mythic or legendary
- The 5-digit number must be random from 10000 to 99999 and not sequential or patterned

Internal process you must follow:
1. First try to create original or rare myth-inspired words
2. Internally check that the name feels novel and not generic
3. If it feels common, regenerate internally
4. Only if you fail to produce a novel result, use the fallback lists
5. If using fallback lists, choose rare and unexpected pairings

Fallback lists (use ONLY if needed):

Adjectives: Swift, Clever, Brave, Mystic, Silent, Bold, Gentle, Noble, Cosmic, Azure, Golden, Silver, Crimson, Emerald, Violet, Ancient, Modern, Wild, Calm, Fierce, Witty, Wise, Lucky, Bright, Shadow, Storm, Dawn, Dusk, Frost, Ember, Ocean, Forest, Desert, Arctic

Animals: Falcon, Otter, Lynx, Phoenix, Leopard, Eagle, Wolf, Bear, Fox, Raven, Hawk, Owl, Tiger, Panda, Deer, Seal, Dolphin, Whale, Shark, Octopus, Dragon, Griffin, Unicorn, Sphinx

Output ONLY the final username and nothing else.`,
                    stream: false,
                    options: { temperature: 0.95 }
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

    // Comment likes - /api/comments/:id/likes
    const commentLikesMatch = path.match(/^\/api\/comments\/(\d+)\/likes$/);
    if (commentLikesMatch) {
        const commentId = commentLikesMatch[1];

        if (method === "POST") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientId = body.clientId;

                if (!clientId) {
                    return json({ error: 'clientId is required' }, 400);
                }

                // Check if already liked
                const existing = await pool.query(
                    'SELECT id FROM comment_likes WHERE comment_id = $1 AND client_id = $2::uuid',
                    [commentId, clientId]
                );

                if (existing.rows.length === 0) {
                    await pool.query(
                        'INSERT INTO comment_likes (comment_id, client_id) VALUES ($1, $2::uuid)',
                        [commentId, clientId]
                    );
                }

                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1',
                    [commentId]
                );

                return json({ count: parseInt(result.rows[0]?.count || '0', 10), liked: true });
            } catch (error) {
                console.error('Comment like error:', error);
                return json({ error: 'Failed to like comment' }, 500);
            }
        }

        if (method === "DELETE") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientId = body.clientId;

                if (!clientId) {
                    return json({ error: 'clientId is required' }, 400);
                }

                await pool.query(
                    'DELETE FROM comment_likes WHERE comment_id = $1 AND client_id = $2::uuid',
                    [commentId, clientId]
                );

                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1',
                    [commentId]
                );

                return json({ count: parseInt(result.rows[0]?.count || '0', 10), liked: false });
            } catch (error) {
                console.error('Comment unlike error:', error);
                return json({ error: 'Failed to unlike comment' }, 500);
            }
        }
    }

    return json({ error: "Not found" }, 404);
}

function json(data: unknown, status = 200): Response {
    // Use secure JSON response with security headers
    const response = secureJson(data, status);

    // Add CORS and cache control headers
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");

    return new Response(response.body, {
        status: response.status,
        headers
    });
}
