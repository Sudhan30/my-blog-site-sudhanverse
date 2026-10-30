import { serve } from "bun";
import { join } from "path";
import { homeRoute } from "./routes/home";
import { postRoute } from "./routes/post";
import { tagRoute } from "./routes/tag";
import { categoryRoute } from "./routes/category";
import { sitemapRoute } from "./routes/sitemap";
import { rssRoute } from "./routes/rss";
import { apiRouter } from "./routes/api";
import { addSecurityHeaders, csrfProtection } from "./middleware/security";

const PORT = process.env.PORT || 80;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");
const RANGE_CHUNK = 2 * 1024 * 1024;

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        // Health check endpoint for Kubernetes
        if (path === "/health" || path === "/healthz") {
            return addSecurityHeaders(new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
                headers: { "Content-Type": "application/json" }
            }));
        }

        // CSRF protection for state-changing requests
        const csrfError = csrfProtection(req);
        if (csrfError) {
            return csrfError;
        }

        // Static file serving
        if (path.startsWith("/styles/") || path.startsWith("/assets/") || path === "/favicon.ico" || path === "/favicon.svg" || path === "/robots.txt") {
            const filePath = join(PUBLIC_DIR, path);
            const file = Bun.file(filePath);
            if (await file.exists()) {
                // Byte ranges let browsers (Safari/iOS especially) stream and seek video
                const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
                if (range && (range[1] || range[2])) {
                    const size = file.size;
                    let start = range[1] ? parseInt(range[1], 10) : size - parseInt(range[2], 10);
                    let end = range[1] && range[2] ? parseInt(range[2], 10) : size - 1;
                    start = Math.max(0, start);
                    end = Math.min(end, size - 1, start + RANGE_CHUNK - 1);
                    if (start > end || start >= size) {
                        return addSecurityHeaders(new Response(null, {
                            status: 416,
                            headers: { "Content-Range": `bytes */${size}` }
                        }));
                    }
                    const bytes = await file.slice(start, end + 1).arrayBuffer();
                    const headers = new Headers(addSecurityHeaders(new Response(null)).headers);
                    headers.set("Content-Type", file.type);
                    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
                    headers.set("Accept-Ranges", "bytes");
                    headers.set("Cache-Control", "public, max-age=86400");
                    return new Response(bytes, { status: 206, headers });
                }
                return addSecurityHeaders(new Response(file, {
                    headers: { "Cache-Control": "public, max-age=86400", "Accept-Ranges": "bytes" }
                }));
            }
            return addSecurityHeaders(new Response("Not Found", { status: 404 }));
        }

        // API routes
        if (path.startsWith("/api/")) {
            return apiRouter(req, path);
        }

        // Page routes
        try {
            if (path === "/" || path === "") {
                return homeRoute(req);
            }

            if (path === "/sitemap.xml") {
                return sitemapRoute();
            }

            if (path === "/rss.xml" || path === "/feed.xml") {
                return rssRoute();
            }

            if (path === "/open-source" || path === "/hackathons" || path === "/engineering") {
                return categoryRoute(path.slice(1));
            }

            const categoryMatch = path.match(/^\/category\/([^/]+)$/);
            if (categoryMatch) {
                return categoryRoute(decodeURIComponent(categoryMatch[1]));
            }

            const postMatch = path.match(/^\/post\/([^/]+)$/);
            if (postMatch) {
                return postRoute(postMatch[1]);
            }

            const tagMatch = path.match(/^\/tag\/([^/]+)$/);
            if (tagMatch) {
                return tagRoute(decodeURIComponent(tagMatch[1]));
            }

            return addSecurityHeaders(new Response("Not Found", { status: 404 }));
        } catch (error) {
            console.error("Server error:", error);
            return addSecurityHeaders(new Response("Internal Server Error", { status: 500 }));
        }
    }
});

console.log(`✨ Blog server running at http://localhost:${PORT}`);
