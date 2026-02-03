import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";

const DATA_DIR = join(import.meta.dir, "..", "data");

interface DataStore<T> {
    read(): Promise<T>;
    write(data: T): Promise<void>;
}

async function ensureDataDir() {
    try {
        await mkdir(DATA_DIR, { recursive: true });
    } catch { }
}

function createStore<T>(filename: string, defaultValue: T): DataStore<T> {
    const filepath = join(DATA_DIR, filename);

    return {
        async read(): Promise<T> {
            await ensureDataDir();
            try {
                const content = await readFile(filepath, "utf-8");
                return JSON.parse(content);
            } catch {
                return defaultValue;
            }
        },
        async write(data: T): Promise<void> {
            await ensureDataDir();
            await writeFile(filepath, JSON.stringify(data, null, 2));
        }
    };
}

// Likes data
interface LikesData {
    [postSlug: string]: {
        count: number;
        users: string[];
    };
}

export const likesStore = createStore<LikesData>("likes.json", {});

// Comments data
export interface CommentData {
    id: string;
    postSlug: string;
    displayName: string;
    content: string;
    status: "pending" | "approved";
    createdAt: string;
}

interface CommentsData {
    comments: CommentData[];
}

export const commentsStore = createStore<CommentsData>("comments.json", { comments: [] });

// Newsletter data
interface NewsletterData {
    subscribers: { email: string; subscribedAt: string }[];
}

export const newsletterStore = createStore<NewsletterData>("newsletter.json", { subscribers: [] });
