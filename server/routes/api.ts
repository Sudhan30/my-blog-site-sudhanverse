import { likesStore, commentsStore, newsletterStore, type CommentData } from "../lib/storage";

export async function apiRouter(req: Request, path: string): Promise<Response> {
    const method = req.method;

    // Newsletter subscription
    if (path === "/api/newsletter" && method === "POST") {
        try {
            const body = await req.json() as { email: string };
            const email = body.email?.toLowerCase().trim();

            if (!email || !email.includes("@")) {
                return json({ error: "Invalid email" }, 400);
            }

            const data = await newsletterStore.read();
            const exists = data.subscribers.some(s => s.email === email);

            if (exists) {
                return json({ message: "Already subscribed!" }, 200);
            }

            data.subscribers.push({ email, subscribedAt: new Date().toISOString() });
            await newsletterStore.write(data);

            return json({ message: "Successfully subscribed!" }, 200);
        } catch {
            return json({ error: "Invalid request" }, 400);
        }
    }

    // Post likes
    const likesMatch = path.match(/^\/api\/posts\/([^/]+)\/likes$/);
    if (likesMatch) {
        const slug = likesMatch[1];
        const data = await likesStore.read();

        if (!data[slug]) {
            data[slug] = { count: 0, users: [] };
        }

        if (method === "GET") {
            return json({ count: data[slug].count });
        }

        if (method === "POST") {
            data[slug].count++;
            await likesStore.write(data);
            return json({ count: data[slug].count, liked: true });
        }

        if (method === "DELETE") {
            data[slug].count = Math.max(0, data[slug].count - 1);
            await likesStore.write(data);
            return json({ count: data[slug].count, liked: false });
        }
    }

    // Post comments
    const commentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (commentsMatch) {
        const slug = commentsMatch[1];
        const data = await commentsStore.read();

        if (method === "GET") {
            const postComments = data.comments
                .filter(c => c.postSlug === slug && c.status === "approved")
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return json({
                comments: postComments.map(c => ({
                    id: c.id,
                    display_name: c.displayName,
                    content: c.content,
                    created_at: c.createdAt,
                    status: c.status
                })),
                total: postComments.length
            });
        }

        if (method === "POST") {
            try {
                const body = await req.json() as { name?: string; comment: string };
                const comment = body.comment?.trim();

                if (!comment || comment.length > 2000) {
                    return json({ error: "Invalid comment" }, 400);
                }

                const newComment: CommentData = {
                    id: crypto.randomUUID(),
                    postSlug: slug,
                    displayName: body.name?.trim() || "Anonymous",
                    content: comment,
                    status: "approved", // Auto-approve for demo
                    createdAt: new Date().toISOString()
                };

                data.comments.push(newComment);
                await commentsStore.write(data);

                return json({ message: "Comment submitted!", id: newComment.id }, 201);
            } catch {
                return json({ error: "Invalid request" }, 400);
            }
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
