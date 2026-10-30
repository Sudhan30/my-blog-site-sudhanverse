import { marked } from "marked";

marked.use({
    gfm: true,
    breaks: true
});

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function slugify(text: string): string {
    return decode(stripTags(text))
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || "section";
}

export function renderMarkdown(content: string): string {
    let html = marked.parse(content) as string;

    // Stable ids on h2/h3 so the table of contents can link to them
    const seen = new Map<string, number>();
    html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
        const base = slugify(inner);
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n === 0 ? base : `${base}-${n + 1}`;
        return `<h${level} id="${id}">${inner}</h${level}>`;
    });

    // Tables scroll horizontally on narrow screens
    html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");

    // Cache-bust local SVG diagrams so CDN and mobile browsers fetch the self-contained colorful SVGs
    html = html.replace(/(src="\/assets\/images\/[^"?]+\.svg)(?:\?[^"]*)?(")/g, "$1?v=2026103004$2");

    // A paragraph holding only an image becomes a figure; the alt text is the caption
    html = html.replace(/<p>\s*(<img [^>]*?alt="([^"]*)"[^>]*>)\s*<\/p>/g, (_m, img: string, alt: string) =>
        alt ? `<figure class="prose-figure">${img}<figcaption>${alt}</figcaption></figure>` : `<figure class="prose-figure">${img}</figure>`
    );

    return html;
}
