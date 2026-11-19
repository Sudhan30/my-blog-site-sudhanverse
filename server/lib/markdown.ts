import { marked } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

marked.use({
    gfm: true,
    breaks: false,
});

export interface HeadingItem {
    id: string;
    label: string;
    level: 2 | 3;
}

const SUPPORTED_LANGS = [
    "typescript",
    "javascript",
    "tsx",
    "jsx",
    "sql",
    "yaml",
    "bash",
    "json",
    "dockerfile",
    "python",
    "kotlin",
    "hcl",
    "css",
    "html",
    "markdown",
    "xml",
    "ini",
    "diff",
] as const;

const LANG_ALIASES: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    yml: "yaml",
    py: "python",
    kt: "kotlin",
    tf: "hcl",
    terraform: "hcl",
    md: "markdown",
    docker: "dockerfile",
    postgres: "sql",
    postgresql: "sql",
    psql: "sql",
    conf: "ini",
    env: "ini",
    toml: "ini",
};

const LANG_LABELS: Record<string, string> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    tsx: "TSX",
    jsx: "JSX",
    sql: "SQL",
    yaml: "YAML",
    bash: "Shell",
    json: "JSON",
    dockerfile: "Dockerfile",
    python: "Python",
    kotlin: "Kotlin",
    hcl: "HCL",
    css: "CSS",
    html: "HTML",
    markdown: "Markdown",
    xml: "XML",
    ini: "Config",
    diff: "Diff",
    text: "Plain text",
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ["github-light", "github-dark-dimmed"],
            langs: [...SUPPORTED_LANGS],
        });
    }
    return highlighterPromise;
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");
const decode = (s: string) =>
    s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
const escapeAttr = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

function slugify(text: string): string {
    return (
        decode(stripTags(text))
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-") || "section"
    );
}

const CALLOUT_LABELS: Record<string, string> = {
    NOTE: "Note",
    IMPORTANT: "Key Decision",
    TIP: "Engineering Tip",
    WARNING: "Trade-off & Caveat",
    CAUTION: "Caution",
};

function normalizeLang(raw?: string): { lang: string; label: string } {
    const token = (raw || "").trim().toLowerCase().split(/\s+/)[0] || "";
    if (!token) return { lang: "text", label: "Code" };
    const mapped = LANG_ALIASES[token] || token;
    if ((SUPPORTED_LANGS as readonly string[]).includes(mapped)) {
        return { lang: mapped, label: LANG_LABELS[mapped] || mapped.toUpperCase() };
    }
    return { lang: "text", label: token.length <= 12 ? token.toUpperCase() : "Code" };
}

export async function renderMarkdown(content: string): Promise<{ html: string; headings: HeadingItem[] }> {
    const highlighter = await getHighlighter();
    const headings: HeadingItem[] = [];

    const renderer = new marked.Renderer();
    renderer.code = (code: string, infostring?: string) => {
        const { lang, label } = normalizeLang(infostring);
        const highlighted = highlighter.codeToHtml(code.replace(/\n$/, ""), {
            lang,
            themes: {
                light: "github-light",
                dark: "github-dark-dimmed",
            },
            defaultColor: false,
        });
        return `<figure class="code-block" data-lang="${escapeAttr(lang)}"><div class="code-block-head"><span class="code-block-lang">${escapeAttr(label)}</span></div>${highlighted}</figure>`;
    };

    let html = marked.parse(content, { renderer }) as string;

    // Transform GitHub-style engineering callouts: > [!NOTE], > [!IMPORTANT], > [!TIP], > [!WARNING], > [!CAUTION]
    html = html.replace(
        /<blockquote>\s*<p>\[!(NOTE|IMPORTANT|TIP|WARNING|CAUTION)\](?:\s|<br\s*\/?>)+([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/gi,
        (_m, rawType: string, firstPara: string, rest: string) => {
            const key = rawType.toUpperCase();
            const slug = key.toLowerCase();
            const title = CALLOUT_LABELS[key] || key;
            return `<aside class="callout callout-${slug}" role="note"><p class="callout-title">${title}</p><div class="callout-body"><p>${firstPara}</p>${rest}</div></aside>`;
        }
    );

    // Stable ids on h2/h3 so the table of contents and deep links stay consistent
    const seen = new Set<string>();
    const suffixes = new Map<string, number>();
    html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, levelStr: string, inner: string) => {
        const level = Number(levelStr) as 2 | 3;
        const label = decode(stripTags(inner)).trim();
        const base = slugify(inner);
        let id = base;
        let suffix = suffixes.get(base) ?? 1;
        while (seen.has(id)) id = `${base}-${++suffix}`;
        suffixes.set(base, suffix);
        seen.add(id);
        headings.push({ id, label, level });
        return `<h${level} id="${id}" class="prose-heading">${inner}<a class="heading-anchor" href="#${id}" aria-label="Copy link to ${escapeAttr(label)}">#</a></h${level}>`;
    });

    // Tables scroll horizontally on narrow screens
    html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");

    // Cache-bust local SVG diagrams so CDN and mobile browsers fetch the self-contained colorful SVGs
    html = html.replace(/(src="\/assets\/images\/[^"?]+\.svg)(?:\?[^"]*)?(")/g, "$1?v=2026111901$2");

    // A paragraph holding only an image becomes a figure; the alt text is the caption
    html = html.replace(/<p>\s*(<img [^>]*?alt="([^"]*)"[^>]*>)\s*<\/p>/g, (_m, img: string, alt: string) =>
        alt ? `<figure class="prose-figure">${img}<figcaption>${alt}</figcaption></figure>` : `<figure class="prose-figure">${img}</figure>`
    );

    return { html, headings };
}
