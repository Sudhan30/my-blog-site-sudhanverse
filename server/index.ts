import { serve } from "bun";
import { join } from "path";
import { homeRoute } from "./routes/home";
import { postRoute } from "./routes/post";
import { tagRoute } from "./routes/tag";
import { sitemapRoute } from "./routes/sitemap";
import { rssRoute } from "./routes/rss";
import { apiRouter } from "./routes/api";

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        // Static file serving
        if (path.startsWith("/styles/") || path.startsWith("/assets/") || path === "/favicon.ico" || path === "/robots.txt") {
            const filePath = join(PUBLIC_DIR, path);
            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file, {
                    headers: { "Cache-Control": "public, max-age=31536000" }
                });
            }
            return new Response("Not Found", { status: 404 });
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

            const postMatch = path.match(/^\/post\/([^/]+)$/);
            if (postMatch) {
                return postRoute(postMatch[1]);
            }

            const tagMatch = path.match(/^\/tag\/([^/]+)$/);
            if (tagMatch) {
                return tagRoute(decodeURIComponent(tagMatch[1]));
            }

            return new Response("Not Found", { status: 404 });
        } catch (error) {
            console.error("Server error:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }
});

console.log(`✨ Blog server running at http://localhost:${PORT}`);
