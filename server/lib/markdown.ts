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

export function renderMarkdown(content: string) {
    const headings: {id: string; label: string}[] = [];
    let html = marked.parse(content) as string;

    // Stable ids on h2/h3 so the table of contents can link to them
    const seen = new Set<string>();
    const suffixes = new Map<string, number>();
    html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
        const base = slugify(inner);
        let id = base;
        let suffix = suffixes.get(base) ?? 1;
        while (seen.has(id)) id = `${base}-${++suffix}`;
        suffixes.set(base, suffix);
        seen.add(id);
        if (level === '2') headings.push({id, label: decode(stripTags(inner))});
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

    return {html, headings};
}
