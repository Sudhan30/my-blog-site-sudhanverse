// API routes for likes, comments, newsletter, telemetry, and feedback
// Uses PostgreSQL when DATABASE_URL is configured, with automatic fallback to local JSON storage for standalone/OSS development.

import { Pool } from 'pg';
import { createHash } from 'crypto';
import { secureJson } from '../middleware/security';
import { likesStore, commentsStore, newsletterStore } from '../lib/storage';

const DATABASE_URL = process.env.DATABASE_URL;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama-service:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:latest';
const GOTIFY_URL = process.env.GOTIFY_URL || 'http://gotify-service.web:80';
const GOTIFY_TOKEN = process.env.GOTIFY_TOKEN;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ensures any clientId string is a valid UUID for PostgreSQL ::uuid columns.
 * If already a valid UUID, returns lowercase UUID; otherwise derives a deterministic UUID v4-formatted hash.
 */
export function normalizeUuid(input?: string | null): string {
    const trimmed = input?.trim();
    if (trimmed && UUID_REGEX.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    const seed = trimmed || 'anonymous-client';
    const hex = createHash('sha256').update(seed).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const pool: Pool | null = DATABASE_URL
    ? new Pool({
          connectionString: DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
      })
    : null;

async function ensureSchema() {
    if (!pool) {
        console.log('📦 Blog API: Using local JSON store (set DATABASE_URL for PostgreSQL)');
        return;
    }
    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            await pool.query('SELECT NOW()');
            console.log('✅ Blog API: PostgreSQL connected');
            break;
        } catch (err) {
            if (attempt === 6) {
                console.error('Blog API: PostgreSQL initialization warning:', err instanceof Error ? err.message : err);
                return;
            }
            await new Promise((r) => setTimeout(r, 1500));
        }
    }
    try {
        // Idempotent schema reconciliation so code and DB never drift
        await pool.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                post_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255),
                user_ip INET,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                client_id UUID,
                ip_hash TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_client ON likes(post_id, client_id) WHERE client_id IS NOT NULL;

            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_name VARCHAR(255) DEFAULT 'Anonymous',
                display_name VARCHAR(255) DEFAULT 'Anonymous',
                author_email VARCHAR(255),
                status VARCHAR(32) DEFAULT 'approved',
                approved BOOLEAN DEFAULT TRUE,
                moderation_reason TEXT,
                client_id UUID,
                ip_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE comments ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) DEFAULT 'Anonymous';
            ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'approved';
            ALTER TABLE comments ADD COLUMN IF NOT EXISTS client_id UUID;
            ALTER TABLE comments ALTER COLUMN author_name SET DEFAULT 'Anonymous';
            ALTER TABLE comments ALTER COLUMN author_name DROP NOT NULL;
            UPDATE comments SET display_name = COALESCE(display_name, author_name, 'Anonymous') WHERE display_name IS NULL;
            UPDATE comments SET status = CASE WHEN approved IS FALSE THEN 'rejected' ELSE 'approved' END WHERE status IS NULL;
            CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
            CREATE INDEX IF NOT EXISTS idx_comments_client_id ON comments(client_id);
            CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

            CREATE TABLE IF NOT EXISTS comment_likes (
                id BIGSERIAL PRIMARY KEY,
                comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
                client_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(comment_id, client_id)
            );
            CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_comment_likes_client_id ON comment_likes(client_id);

            CREATE TABLE IF NOT EXISTS comment_summaries (
                id SERIAL PRIMARY KEY,
                post_id VARCHAR(255) UNIQUE NOT NULL,
                summary_text TEXT NOT NULL,
                comment_count INTEGER DEFAULT 0,
                last_comment_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed'))
            );

            CREATE TABLE IF NOT EXISTS user_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                user_agent TEXT,
                viewport_width INTEGER,
                viewport_height INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                title TEXT,
                referrer TEXT,
                viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
                event_name TEXT NOT NULL,
                event_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
    } catch (err) {
        console.error('Blog API: PostgreSQL initialization warning:', err instanceof Error ? err.message : err);
    }
}

ensureSchema();

export interface PostEngagement {
    likes: number;
    comments: number;
}

/**
 * Fetch engagement counts (likes & approved comments) for all posts.
 * Used by SSR routes (home, category, tag, post) and GET /api/posts/stats.
 */
export async function getAllPostStats(): Promise<Record<string, PostEngagement>> {
    const stats: Record<string, PostEngagement> = {};
    const ensure = (slug: string) => {
        if (!stats[slug]) stats[slug] = { likes: 0, comments: 0 };
        return stats[slug];
    };

    if (pool) {
        try {
            const [likesRes, commentsRes] = await Promise.all([
                pool.query('SELECT post_id, COUNT(*)::int AS count FROM likes GROUP BY post_id'),
                pool.query("SELECT post_id, COUNT(*)::int AS count FROM comments WHERE status = 'approved' GROUP BY post_id"),
            ]);
            for (const row of likesRes.rows) {
                ensure(row.post_id).likes = row.count;
            }
            for (const row of commentsRes.rows) {
                ensure(row.post_id).comments = row.count;
            }
            return stats;
        } catch (err) {
            console.error('Failed to query post stats from PostgreSQL:', err);
        }
    }

    // Fallback to local JSON store
    const likesData = await likesStore.read();
    for (const [slug, entry] of Object.entries(likesData)) {
        ensure(slug).likes = entry.count || 0;
    }
    const commentsData = await commentsStore.read();
    for (const comment of commentsData.comments) {
        if (comment.status === 'approved') {
            ensure(comment.postSlug).comments += 1;
        }
    }
    return stats;
}

/**
 * Moderate a comment using Ollama LLM
 */
async function moderateComment(content: string, authorName: string): Promise<{ isHarmful: boolean; reason?: string }> {
    try {
        const prompt = `You are a content moderator. Analyze the following blog comment and determine if it contains harmful, offensive, degrading, spam, or inappropriate content.

Comment by "${authorName}":
"${content}"

Respond with ONLY a JSON object in this exact format:
{"harmful": true/false, "reason": "brief explanation if harmful, empty string if not"}

Be strict about: hate speech, harassment, threats, spam, explicit content, personal attacks, or discriminatory language.
Be lenient about: constructive criticism, mild disagreement, casual language, technical questions.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                think: false,
                options: { temperature: 0.1 }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { isHarmful: false };
        }

        const data = await response.json() as { response: string };
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            const isHarmful = result.harmful === true;
            return { isHarmful, reason: result.reason || '' };
        }
        return { isHarmful: false };
    } catch {
        return { isHarmful: false }; // Fail open
    }
}

/**
 * Generate or update AI reader summary when a post has >= 2 approved comments
 */
async function refreshCommentSummary(postId: string): Promise<void> {
    if (!pool) return;
    try {
        const res = await pool.query(
            `SELECT id, display_name, content
             FROM comments
             WHERE post_id = $1 AND status = 'approved'
             ORDER BY created_at DESC
             LIMIT 25`,
            [postId]
        );
        if (res.rows.length < 2) return;

        const commentLines = res.rows
            .map((r) => `- ${r.display_name}: "${r.content}"`)
            .join('\n');

        const prompt = `Summarize the following reader comments on an engineering blog post in 1-2 concise, natural sentences highlighting key themes or takeaways. Do not use bullet points or markdown formatting.

Comments:
${commentLines}

Summary:`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                think: false,
                options: { temperature: 0.3 }
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!ollamaRes.ok) return;
        const data = await ollamaRes.json() as { response: string };
        const summaryText = data.response.trim().replace(/^["']|["']$/g, '');
        if (!summaryText) return;

        const lastCommentId = res.rows[0].id;
        await pool.query(
            `INSERT INTO comment_summaries (post_id, summary_text, comment_count, last_comment_id, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (post_id) DO UPDATE
             SET summary_text = EXCLUDED.summary_text,
                 comment_count = EXCLUDED.comment_count,
                 last_comment_id = EXCLUDED.last_comment_id,
                 updated_at = NOW()`,
            [postId, summaryText, res.rows.length, lastCommentId]
        );
    } catch (err) {
        console.error('Summary generation skipped:', err instanceof Error ? err.message : err);
    }
}

function generateFallbackUsername(): string {
    const adjectives = [
        'Astral', 'Solar', 'Lunar', 'Aether', 'Vedic', 'Nordic', 'Zephyr', 'Hyperion',
        'Valiant', 'Cyber', 'Quantum', 'Obsidian', 'Radiant', 'Halcyon', 'Sovereign', 'Kinetic'
    ];
    const nouns = [
        'Garuda', 'Valkyrie', 'Phoenix', 'Fenrir', 'Pegasus', 'Sphinx', 'Griffin', 'Anubis',
        'Titan', 'Orion', 'Atlas', 'Vortex', 'Falcon', 'Raven', 'Lynx', 'Drakon'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(10000 + Math.random() * 90000);
    return `${adj}-${noun}-${num}`;
}

export async function apiRouter(req: Request, path: string): Promise<Response> {
    const method = req.method;

    // Batch engagement stats: GET /api/posts/stats
    if (path === "/api/posts/stats" && method === "GET") {
        const stats = await getAllPostStats();
        return json({ stats });
    }

    // Newsletter subscription
    if (path === "/api/newsletter" && method === "POST") {
        try {
            const body = await req.json() as { email: string };
            const email = body.email?.trim().toLowerCase();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return json({ error: 'Valid email address is required' }, 400);
            }

            if (pool) {
                const existing = await pool.query(
                    'SELECT email, status FROM newsletter_subscribers WHERE email = $1',
                    [email]
                );

                if (existing.rows.length > 0) {
                    const subscriber = existing.rows[0];
                    if (subscriber.status === 'active') {
                        return json({ message: "You're already subscribed!" });
                    } else {
                        await pool.query(
                            'UPDATE newsletter_subscribers SET status = $1, subscribed_at = NOW() WHERE email = $2',
                            ['active', email]
                        );
                        return json({ message: 'Welcome back! Subscription reactivated.' });
                    }
                }

                await pool.query(
                    'INSERT INTO newsletter_subscribers (email, status) VALUES ($1, $2)',
                    [email, 'active']
                );
                return json({ message: 'Subscribed! You will get the next deep dive when it ships.' });
            } else {
                const store = await newsletterStore.read();
                const existing = store.subscribers.find(s => s.email === email);
                if (existing) {
                    existing.status = 'active';
                    await newsletterStore.write(store);
                    return json({ message: "You're already subscribed!" });
                }
                store.subscribers.push({ email, status: 'active', subscribedAt: new Date().toISOString() });
                await newsletterStore.write(store);
                return json({ message: 'Subscribed! You will get the next deep dive when it ships.' });
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            return json({ error: 'Failed to subscribe' }, 500);
        }
    }

    // Post likes - /api/posts/:id/likes
    const likesMatch = path.match(/^\/api\/posts\/([^/]+)\/likes$/);
    if (likesMatch) {
        const postId = decodeURIComponent(likesMatch[1]);
        const url = new URL(req.url);

        if (method === "GET") {
            const rawClientId = url.searchParams.get('clientId');
            const clientUuid = rawClientId ? normalizeUuid(rawClientId) : null;

            if (pool) {
                try {
                    const countRes = await pool.query(
                        'SELECT COUNT(*)::int as count FROM likes WHERE post_id = $1',
                        [postId]
                    );
                    let liked = false;
                    if (clientUuid) {
                        const likedRes = await pool.query(
                            'SELECT 1 FROM likes WHERE post_id = $1 AND client_id = $2::uuid LIMIT 1',
                            [postId, clientUuid]
                        );
                        liked = likedRes.rows.length > 0;
                    }
                    return json({ count: countRes.rows[0]?.count || 0, liked });
                } catch (error) {
                    console.error('Likes GET error:', error);
                    return json({ count: 0, liked: false });
                }
            } else {
                const store = await likesStore.read();
                const entry = store[postId] || { count: 0, users: [] };
                const liked = clientUuid ? entry.users.includes(clientUuid) : false;
                return json({ count: entry.count, liked });
            }
        }

        if (method === "POST") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientUuid = normalizeUuid(body.clientId);

                if (pool) {
                    const existing = await pool.query(
                        'SELECT id FROM likes WHERE post_id = $1 AND client_id = $2::uuid LIMIT 1',
                        [postId, clientUuid]
                    );
                    if (existing.rows.length === 0) {
                        await pool.query(
                            'INSERT INTO likes (post_id, client_id) VALUES ($1, $2::uuid) ON CONFLICT DO NOTHING',
                            [postId, clientUuid]
                        );
                    }
                    const result = await pool.query(
                        'SELECT COUNT(*)::int as count FROM likes WHERE post_id = $1',
                        [postId]
                    );
                    return json({ count: result.rows[0]?.count || 0, liked: true });
                } else {
                    const store = await likesStore.read();
                    const entry = store[postId] || { count: 0, users: [] };
                    if (!entry.users.includes(clientUuid)) {
                        entry.users.push(clientUuid);
                        entry.count = entry.users.length;
                        store[postId] = entry;
                        await likesStore.write(store);
                    }
                    return json({ count: entry.count, liked: true });
                }
            } catch (error) {
                console.error('Likes POST error:', error);
                return json({ error: 'Failed to like post' }, 500);
            }
        }

        if (method === "DELETE") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientUuid = normalizeUuid(body.clientId);

                if (pool) {
                    await pool.query(
                        'DELETE FROM likes WHERE post_id = $1 AND client_id = $2::uuid',
                        [postId, clientUuid]
                    );
                    const result = await pool.query(
                        'SELECT COUNT(*)::int as count FROM likes WHERE post_id = $1',
                        [postId]
                    );
                    return json({ count: result.rows[0]?.count || 0, liked: false });
                } else {
                    const store = await likesStore.read();
                    const entry = store[postId] || { count: 0, users: [] };
                    entry.users = entry.users.filter(u => u !== clientUuid);
                    entry.count = entry.users.length;
                    store[postId] = entry;
                    await likesStore.write(store);
                    return json({ count: entry.count, liked: false });
                }
            } catch (error) {
                console.error('Unlike error:', error);
                return json({ error: 'Failed to unlike post' }, 500);
            }
        }
    }

    // Comment summary - GET /api/posts/:id/summary
    const summaryMatch = path.match(/^\/api\/posts\/([^/]+)\/summary$/);
    if (summaryMatch && method === "GET") {
        const postId = decodeURIComponent(summaryMatch[1]);
        if (pool) {
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
        } else {
            const store = await commentsStore.read();
            const entry = store.summaries?.[postId];
            if (!entry) return json({ summary: null });
            return json(entry);
        }
    }

    // Post comments - /api/posts/:id/comments
    const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (commentsMatch) {
        const postId = decodeURIComponent(commentsMatch[1]);

        if (method === "GET") {
            const url = new URL(req.url);
            const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
            const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
            const offset = (page - 1) * limit;
            const sort = url.searchParams.get('sort') || 'recent';
            const rawClientId = url.searchParams.get('clientId');
            const clientUuid = rawClientId ? normalizeUuid(rawClientId) : null;

            if (pool) {
                try {
                    let orderBy = 'c.created_at DESC';
                    if (sort === 'oldest') {
                        orderBy = 'c.created_at ASC';
                    } else if (sort === 'most_liked') {
                        orderBy = 'like_count DESC, c.created_at DESC';
                    }

                    const countResult = await pool.query(
                        `SELECT COUNT(*)::int as total
                         FROM comments
                         WHERE post_id = $1 AND status = 'approved'`,
                        [postId]
                    );
                    const total = countResult.rows[0]?.total || 0;

                    const query = `SELECT
                            c.id,
                            c.content,
                            COALESCE(c.display_name, c.author_name, 'Anonymous') as display_name,
                            c.created_at,
                            COUNT(cl.id)::int as like_count,
                            ${clientUuid ? `EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND client_id = $4::uuid) as user_liked` : 'false as user_liked'}
                         FROM comments c
                         LEFT JOIN comment_likes cl ON c.id = cl.comment_id
                         WHERE c.post_id = $1 AND c.status = 'approved'
                         GROUP BY c.id
                         ORDER BY ${orderBy}
                         LIMIT $2 OFFSET $3`;
                    const params = clientUuid ? [postId, limit, offset, clientUuid] : [postId, limit, offset];

                    const result = await pool.query(query, params);

                    return json({
                        comments: result.rows.map(row => ({
                            id: row.id,
                            content: row.content,
                            display_name: row.display_name,
                            created_at: row.created_at,
                            like_count: Number(row.like_count || 0),
                            user_liked: Boolean(row.user_liked)
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
            } else {
                const store = await commentsStore.read();
                const filtered = store.comments.filter(c => c.postSlug === postId && c.status === 'approved');
                if (sort === 'oldest') {
                    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                } else if (sort === 'most_liked') {
                    filtered.sort((a, b) => (b.likedBy.length - a.likedBy.length) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                } else {
                    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                }
                const total = filtered.length;
                const paged = filtered.slice(offset, offset + limit);
                return json({
                    comments: paged.map(c => ({
                        id: c.id,
                        content: c.content,
                        display_name: c.displayName,
                        created_at: c.createdAt,
                        like_count: c.likedBy.length,
                        user_liked: clientUuid ? c.likedBy.includes(clientUuid) : false
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasMore: offset + paged.length < total
                    }
                });
            }
        }

        if (method === "POST") {
            try {
                const body = await req.json() as { name?: string; comment: string; clientId?: string };
                const authorName = (body.name?.trim() || 'Anonymous').slice(0, 80);
                const content = body.comment?.trim();
                const clientUuid = normalizeUuid(body.clientId);

                if (!content) {
                    return json({ error: 'Comment content is required' }, 400);
                }

                if (pool) {
                    if (authorName !== 'Anonymous') {
                        const nameCheck = await pool.query(
                            `SELECT client_id FROM comments
                             WHERE LOWER(COALESCE(display_name, author_name)) = LOWER($1)
                               AND client_id IS NOT NULL
                               AND client_id != $2::uuid
                             LIMIT 1`,
                            [authorName, clientUuid]
                        );
                        if (nameCheck.rows.length > 0) {
                            return json({ error: 'This display name is already taken by another reader' }, 409);
                        }
                    }

                    const result = await pool.query(
                        `INSERT INTO comments (post_id, content, display_name, author_name, status, approved, client_id)
                         VALUES ($1, $2, $3, $3, 'approved', TRUE, $4::uuid)
                         RETURNING id, content, display_name, created_at`,
                        [postId, content, authorName, clientUuid]
                    );

                    const commentId = result.rows[0].id;

                    // Async moderation + summary update
                    moderateComment(content, authorName).then(async (modResult) => {
                        if (modResult.isHarmful) {
                            await pool.query(
                                `UPDATE comments SET status = 'rejected', approved = FALSE, moderation_reason = $2 WHERE id = $1`,
                                [commentId, modResult.reason || 'Flagged by moderation']
                            );
                        } else {
                            await refreshCommentSummary(postId);
                        }
                    }).catch(err => console.error('Async moderation failed:', err));

                    return json(result.rows[0], 201);
                } else {
                    const store = await commentsStore.read();
                    const newComment = {
                        id: store.nextId++,
                        postSlug: postId,
                        displayName: authorName,
                        clientId: clientUuid,
                        content,
                        status: 'approved' as const,
                        createdAt: new Date().toISOString(),
                        likedBy: []
                    };
                    store.comments.push(newComment);
                    await commentsStore.write(store);
                    return json({
                        id: newComment.id,
                        content: newComment.content,
                        display_name: newComment.displayName,
                        created_at: newComment.createdAt
                    }, 201);
                }
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
            const clientUuid = normalizeUuid(body.clientId);
            const newDisplayName = body.newDisplayName?.trim().slice(0, 80);

            if (!newDisplayName) {
                return json({ error: 'newDisplayName is required' }, 400);
            }

            if (pool) {
                const nameCheck = await pool.query(
                    `SELECT client_id FROM comments
                     WHERE LOWER(COALESCE(display_name, author_name)) = LOWER($1)
                       AND client_id IS NOT NULL
                       AND client_id != $2::uuid
                     LIMIT 1`,
                    [newDisplayName, clientUuid]
                );
                if (nameCheck.rows.length > 0) {
                    return json({ error: 'This display name is already taken by another reader' }, 409);
                }

                const result = await pool.query(
                    `UPDATE comments
                     SET display_name = $1, author_name = $1
                     WHERE client_id = $2::uuid AND status = 'approved'
                     RETURNING id`,
                    [newDisplayName, clientUuid]
                );

                return json({
                    success: true,
                    updatedCount: result.rows.length,
                    message: `Updated ${result.rows.length} comment(s) to "${newDisplayName}"`
                });
            } else {
                const store = await commentsStore.read();
                let updatedCount = 0;
                for (const c of store.comments) {
                    if (c.clientId === clientUuid) {
                        c.displayName = newDisplayName;
                        updatedCount++;
                    }
                }
                await commentsStore.write(store);
                return json({
                    success: true,
                    updatedCount,
                    message: `Updated ${updatedCount} comment(s) to "${newDisplayName}"`
                });
            }
        } catch (error) {
            console.error('Update display name error:', error);
            return json({ error: 'Failed to update display name' }, 500);
        }
    }

    // Feedback
    if (path === "/api/feedback" && method === "POST") {
        try {
            const body = await req.json() as { name?: string; message: string; feedbackType?: string; rating?: number };
            if (!body.message?.trim()) {
                return json({ error: 'Feedback message is required' }, 400);
            }

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

    // Generate creative display name using Ollama (with instant server-side fallback)
    if (path === "/api/generate-name" && method === "GET") {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: `Generate ONE creative username in the exact format Word-Word-5DigitNumber (e.g. Astral-Garuda-48291). Blend mythological or cosmic vibes with modern style. Output ONLY the final username and nothing else.`,
                    stream: false,
                    think: false,
                    options: { temperature: 0.9, num_predict: 24 }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (ollamaResponse.ok) {
                const ollamaData = await ollamaResponse.json() as { response: string };
                const match = ollamaData.response.trim().match(/[A-Za-z]+-[A-Za-z]+-\d{4,6}/);
                if (match) {
                    return json({ name: match[0], source: 'ai' });
                }
            }
        } catch {
            // Fall through to deterministic server fallback
        }
        return json({ name: generateFallbackUsername(), source: 'fallback' });
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

            if (pool && body.sessionId) {
                const sessionUuid = normalizeUuid(body.sessionId);
                await pool.query(
                    `INSERT INTO user_sessions (id, user_id, user_agent, viewport_width, viewport_height, last_seen_at)
                     VALUES ($1::uuid, $2, $3, $4, $5, NOW())
                     ON CONFLICT (id) DO UPDATE SET last_seen_at = NOW()`,
                    [
                        sessionUuid,
                        body.userId || 'anonymous',
                        body.userAgent || null,
                        body.viewport?.width || null,
                        body.viewport?.height || null
                    ]
                );

                if (body.events && body.events.length > 0) {
                    for (const event of body.events) {
                        if (event.name === 'page_view') {
                            await pool.query(
                                `INSERT INTO page_views (session_id, url, title, referrer, viewed_at)
                                 VALUES ($1::uuid, $2, $3, $4, $5::timestamp)`,
                                [
                                    sessionUuid,
                                    String(event.data?.url || ''),
                                    String(event.data?.title || ''),
                                    String(event.data?.referrer || ''),
                                    event.timestamp || new Date().toISOString()
                                ]
                            );
                        } else {
                            await pool.query(
                                `INSERT INTO events (session_id, event_name, event_data, created_at)
                                 VALUES ($1::uuid, $2, $3, $4::timestamp)`,
                                [
                                    sessionUuid,
                                    event.name,
                                    event.data || {},
                                    event.timestamp || new Date().toISOString()
                                ]
                            );
                        }
                    }
                }
            }

            return json({ success: true });
        } catch (error) {
            console.error('Telemetry error:', error);
            return json({ success: false }, 200);
        }
    }

    // Comment likes - /api/comments/:id/likes
    const commentLikesMatch = path.match(/^\/api\/comments\/(\d+)\/likes$/);
    if (commentLikesMatch) {
        const commentId = parseInt(commentLikesMatch[1], 10);

        if (method === "POST") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientUuid = normalizeUuid(body.clientId);

                if (pool) {
                    await pool.query(
                        'INSERT INTO comment_likes (comment_id, client_id) VALUES ($1, $2::uuid) ON CONFLICT DO NOTHING',
                        [commentId, clientUuid]
                    );
                    const result = await pool.query(
                        'SELECT COUNT(*)::int as count FROM comment_likes WHERE comment_id = $1',
                        [commentId]
                    );
                    return json({ count: result.rows[0]?.count || 0, liked: true });
                } else {
                    const store = await commentsStore.read();
                    const comment = store.comments.find(c => c.id === commentId);
                    if (!comment) return json({ error: 'Comment not found' }, 404);
                    if (!comment.likedBy.includes(clientUuid)) {
                        comment.likedBy.push(clientUuid);
                        await commentsStore.write(store);
                    }
                    return json({ count: comment.likedBy.length, liked: true });
                }
            } catch (error) {
                console.error('Comment like error:', error);
                return json({ error: 'Failed to like comment' }, 500);
            }
        }

        if (method === "DELETE") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const clientUuid = normalizeUuid(body.clientId);

                if (pool) {
                    await pool.query(
                        'DELETE FROM comment_likes WHERE comment_id = $1 AND client_id = $2::uuid',
                        [commentId, clientUuid]
                    );
                    const result = await pool.query(
                        'SELECT COUNT(*)::int as count FROM comment_likes WHERE comment_id = $1',
                        [commentId]
                    );
                    return json({ count: result.rows[0]?.count || 0, liked: false });
                } else {
                    const store = await commentsStore.read();
                    const comment = store.comments.find(c => c.id === commentId);
                    if (!comment) return json({ error: 'Comment not found' }, 404);
                    comment.likedBy = comment.likedBy.filter(u => u !== clientUuid);
                    await commentsStore.write(store);
                    return json({ count: comment.likedBy.length, liked: false });
                }
            } catch (error) {
                console.error('Comment unlike error:', error);
                return json({ error: 'Failed to unlike comment' }, 500);
            }
        }
    }

    return json({ error: "Not found" }, 404);
}

function json(data: unknown, status = 200): Response {
    const response = secureJson(data, status);
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");

    return new Response(response.body, {
        status: response.status,
        headers
    });
}
