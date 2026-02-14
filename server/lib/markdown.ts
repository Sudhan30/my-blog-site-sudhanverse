import { marked } from "marked";

// Configure marked with basic options
marked.use({
    gfm: true,
    breaks: true
});

// Use default marked renderers (custom renderers were incompatible with marked v12)
// marked.use({
//     renderer: {
//         // Custom renderers removed - using defaults
//     }
// });

export function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
}
