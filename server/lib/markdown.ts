import { marked } from "marked";

function escapeHtml(text: string | undefined): string {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Configure marked with basic options
marked.use({
    gfm: true,
    breaks: true
});

// Custom extensions for code blocks
marked.use({
    renderer: {
        code(token: any): string {
            const language = token.lang || "text";
            const codeText = token.text || "";
            return `<pre class="code-block"><code class="language-${language}">${escapeHtml(codeText)}</code></pre>\n`;
        }
    }
});

export function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
}
