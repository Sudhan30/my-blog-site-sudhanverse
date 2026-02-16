import { readdir } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

const CONTENT_DIR = join(import.meta.dir, "..", "..", "content", "posts");

export interface Post {
    slug: string;
    title: string;
    date: string;
    tags: string[];
    excerpt: string;
    content: string;
    readTime?: number;
}

export interface PostIndex {
    posts: Omit<Post, "content">[];
    tags: Record<string, number>;
}

let cachedPosts: Post[] | null = null;
let cachedIndex: PostIndex | null = null;

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
            tags: data.tags || [],
            excerpt: data.excerpt || body.slice(0, 160) + "...",
            content: body,
            readTime: data.readTime
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

    for (const post of posts) {
        for (const tag of post.tags) {
            tags[tag] = (tags[tag] || 0) + 1;
        }
    }

    cachedIndex = {
        posts: posts.map(({ content, ...rest }) => rest),
        tags
    };

    return cachedIndex;
}

export async function getPostsByTag(tag: string): Promise<Omit<Post, "content">[]> {
    const index = await getPostIndex();
    return index.posts.filter(p => p.tags.includes(tag));
}

// Clear cache - useful for development
export function clearCache() {
    cachedPosts = null;
    cachedIndex = null;
}
