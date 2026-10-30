import { readdir } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

const CONTENT_DIR = join(import.meta.dir, "..", "..", "content", "posts");

export type PostCategory = "open-source" | "hackathon" | "engineering";

export interface CategoryMeta {
    id: PostCategory;
    slug: string;
    label: string;
    shortLabel: string;
    kicker: string;
    title: string;
    description: string;
}

export const CATEGORY_META: Record<PostCategory, CategoryMeta> = {
    "open-source": {
        id: "open-source",
        slug: "open-source",
        label: "Open Source",
        shortLabel: "Open Source",
        kicker: "OPEN SOURCE RELEASES",
        title: "Open Source Software",
        description: "Privacy-first tools, Android apps, and systems I build in the open and ship under permissive licenses."
    },
    "hackathon": {
        id: "hackathon",
        slug: "hackathons",
        label: "Hackathons",
        shortLabel: "Hackathons",
        kicker: "COMPETITIVE AI BUILDS",
        title: "Hackathon Builds & Wins",
        description: "End-to-end AI agents and verification systems built under the clock at SF hackathons—with live demo videos and architecture deep dives."
    },
    "engineering": {
        id: "engineering",
        slug: "engineering",
        label: "Engineering Blog",
        shortLabel: "Engineering",
        kicker: "SYSTEMS & ARCHITECTURE",
        title: "Engineering Deep Dives",
        description: "Production write-ups on distributed data pipelines, local multi-model LLM agents, self-hosted Kubernetes (K3s + FluxCD), and cloud cost optimization."
    }
};

export interface Post {
    slug: string;
    title: string;
    date: string;
    category: PostCategory;
    tags: string[];
    excerpt: string;
    content: string;
    readTime?: number;
    cover?: string;
    video?: string;
    poster?: string;
    featured?: boolean;
    badge?: string;
    event?: string;
    repoUrl?: string;
    releaseUrl?: string;
    version?: string;
    license?: string;
    highlights?: string[];
}

export interface PostIndex {
    posts: Omit<Post, "content">[];
    tags: Record<string, number>;
    categories: Record<PostCategory, number>;
}

let cachedPosts: Post[] | null = null;
let cachedIndex: PostIndex | null = null;

function inferCategory(data: Record<string, any>): PostCategory {
    const raw = String(data.category || "").toLowerCase().trim();
    if (raw === "open-source" || raw === "opensource") return "open-source";
    if (raw === "hackathon" || raw === "hackathons") return "hackathon";
    if (raw === "engineering" || raw === "blog" || raw === "regular") return "engineering";

    const tags: string[] = Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).toLowerCase()) : [];
    if (tags.includes("open-source") || data.repoUrl) return "open-source";
    if (tags.includes("hackathon") || data.event?.toLowerCase().includes("hackathon")) return "hackathon";
    return "engineering";
}

export async function getAllPosts(): Promise<Post[]> {
    if (cachedPosts) return cachedPosts;

    const files = await readdir(CONTENT_DIR);
    const mdFiles = files.filter(f => f.endsWith(".md"));

    const posts: Post[] = [];
    for (const file of mdFiles) {
        const filePath = join(CONTENT_DIR, file);
        const content = await Bun.file(filePath).text();
        const { data, content: body } = matter(content);

        posts.push({
            slug: data.slug || file.replace(".md", ""),
            title: data.title || "Untitled",
            date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            category: inferCategory(data),
            tags: data.tags || [],
            excerpt: data.excerpt || body.slice(0, 160) + "...",
            content: body,
            readTime: data.readTime,
            cover: data.cover,
            video: data.video,
            poster: data.poster,
            featured: data.featured === true,
            badge: data.badge,
            event: data.event,
            repoUrl: data.repoUrl,
            releaseUrl: data.releaseUrl,
            version: data.version,
            license: data.license,
            highlights: Array.isArray(data.highlights) ? data.highlights : []
        });
    }

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    cachedPosts = posts;
    return posts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    const posts = await getAllPosts();
    return posts.find(p => p.slug === slug) || null;
}

export async function getPostIndex(): Promise<PostIndex> {
    if (cachedIndex) return cachedIndex;

    const posts = await getAllPosts();
    const tags: Record<string, number> = {};
    const categories: Record<PostCategory, number> = {
        "open-source": 0,
        "hackathon": 0,
        "engineering": 0
    };

    for (const post of posts) {
        categories[post.category] = (categories[post.category] || 0) + 1;
        for (const tag of post.tags) {
            tags[tag] = (tags[tag] || 0) + 1;
        }
    }

    cachedIndex = {
        posts: posts.map(({ content, ...rest }) => rest),
        tags,
        categories
    };

    return cachedIndex;
}

export async function getPostsByTag(tag: string): Promise<Omit<Post, "content">[]> {
    const index = await getPostIndex();
    return index.posts.filter(p => p.tags.includes(tag));
}

export async function getPostsByCategory(category: PostCategory): Promise<Omit<Post, "content">[]> {
    const index = await getPostIndex();
    return index.posts.filter(p => p.category === category);
}

export function resolveCategorySlug(slug: string): PostCategory | null {
    const normalized = slug.toLowerCase().trim();
    if (normalized === "open-source" || normalized === "opensource") return "open-source";
    if (normalized === "hackathon" || normalized === "hackathons") return "hackathon";
    if (normalized === "engineering" || normalized === "blog" || normalized === "posts" || normalized === "writing") return "engineering";
    return null;
}

export function clearCache() {
    cachedPosts = null;
    cachedIndex = null;
}
