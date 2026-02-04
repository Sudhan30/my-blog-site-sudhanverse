// Proxy API requests to the blog-backend service
// The blog-backend handles likes, comments, newsletter with PostgreSQL + Redis

const BACKEND_URL = process.env.BACKEND_URL || 'http://blog-backend-service:3001';

export async function apiRouter(req: Request, path: string): Promise<Response> {
    const method = req.method;

    // Newsletter subscription - proxy to backend
    if (path === "/api/newsletter" && method === "POST") {
        try {
            const body = await req.json() as { email: string };
            const backendRes = await fetch(`${BACKEND_URL}/api/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await backendRes.json();
            return json(data, backendRes.status);
        } catch (error) {
            console.error('Newsletter proxy error:', error);
            return json({ error: 'Failed to connect to backend' }, 502);
        }
    }

    // Post likes - match path pattern
    const likesMatch = path.match(/^\/api\/posts\/([^/]+)\/likes$/) ||
        path.match(/^\/posts\/([^/]+)\/likes$/);
    if (likesMatch) {
        const postId = likesMatch[1];

        if (method === "GET") {
            try {
                const backendRes = await fetch(`${BACKEND_URL}/api/posts/${postId}/likes`);
                const data = await backendRes.json() as { likes?: number };
                return json({ count: data.likes || 0 });
            } catch (error) {
                console.error('Likes GET proxy error:', error);
                return json({ count: 0 });
            }
        }

        if (method === "POST") {
            try {
                // Get clientId from localStorage (sent in body or generate new)
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const backendRes = await fetch(`${BACKEND_URL}/api/posts/${postId}/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: body.clientId })
                });
                const data = await backendRes.json() as { likes?: number; success?: boolean; clientId?: string };
                return json({ count: data.likes || 0, liked: true, clientId: data.clientId });
            } catch (error) {
                console.error('Likes POST proxy error:', error);
                return json({ error: 'Failed to like post' }, 502);
            }
        }

        if (method === "DELETE") {
            try {
                const body = await req.json().catch(() => ({})) as { clientId?: string };
                const backendRes = await fetch(`${BACKEND_URL}/api/posts/${postId}/unlike`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: body.clientId })
                });
                const data = await backendRes.json() as { likes?: number };
                return json({ count: data.likes || 0, liked: false });
            } catch (error) {
                console.error('Unlike proxy error:', error);
                return json({ error: 'Failed to unlike post' }, 502);
            }
        }
    }

    // Post comments - match path pattern
    const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/) ||
        path.match(/^\/posts\/([^/]+)\/comments$/);
    if (commentsMatch) {
        const postId = commentsMatch[1];

        if (method === "GET") {
            try {
                const backendRes = await fetch(`${BACKEND_URL}/api/posts/${postId}/comments`);
                const data = await backendRes.json() as { comments?: unknown[]; pagination?: { total: number } };
                return json({
                    comments: data.comments || [],
                    total: data.pagination?.total || 0
                });
            } catch (error) {
                console.error('Comments GET proxy error:', error);
                return json({ comments: [], total: 0 });
            }
        }

        if (method === "POST") {
            try {
                const body = await req.json() as { name?: string; comment: string };
                const backendRes = await fetch(`${BACKEND_URL}/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        displayName: body.name || 'Anonymous',
                        content: body.comment
                    })
                });
                const data = await backendRes.json();
                if (backendRes.ok) {
                    return json({ message: 'Comment submitted!', id: (data as { comment?: { id?: string } }).comment?.id }, 201);
                }
                return json(data, backendRes.status);
            } catch (error) {
                console.error('Comments POST proxy error:', error);
                return json({ error: 'Failed to add comment' }, 502);
            }
        }
    }

    // Feedback - proxy to backend
    if (path === "/api/feedback" && method === "POST") {
        try {
            const body = await req.json() as { name?: string; message: string; feedbackType?: string; rating?: number };
            const backendRes = await fetch(`${BACKEND_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: body.name || 'Anonymous',
                    feedbackType: body.feedbackType || 'general',
                    message: body.message,
                    rating: body.rating || 5
                })
            });
            const data = await backendRes.json();
            if (backendRes.ok) {
                return json({ message: 'Feedback received! Thank you.' }, 200);
            }
            return json(data, backendRes.status);
        } catch (error) {
            console.error('Feedback proxy error:', error);
            // Fallback to logging if backend is unavailable
            return json({ message: 'Feedback received! Thank you.' }, 200);
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
