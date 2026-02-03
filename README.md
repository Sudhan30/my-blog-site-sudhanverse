# Sudhanverse Blog

A minimal, fast, SSR blog built with Bun.js.

## Features

- **Server-Side Rendering** - All pages rendered on the server for optimal SEO
- **Dark/Light Mode** - Toggle with system preference detection
- **Reading Progress Bar** - Visual scroll indicator
- **Markdown Content** - Posts written in Markdown with frontmatter
- **Minimal Dependencies** - Only `marked` and `gray-matter`

## Quick Start

```bash
# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start development server
bun run dev
```

Visit **http://localhost:3000**

## Project Structure

```
├── server/
│   ├── index.ts           # Main server
│   ├── lib/               # Utilities
│   ├── routes/            # Route handlers
│   └── templates/         # HTML templates
├── content/posts/         # Markdown blog posts
├── public/
│   ├── styles/            # CSS
│   └── assets/            # Images
├── package.json
└── tsconfig.json
```

## Adding Posts

Create a new `.md` file in `content/posts/` with frontmatter:

```markdown
---
title: "My Post Title"
date: "2024-02-03"
tags: ["tag1", "tag2"]
excerpt: "Brief description"
slug: "my-post-slug"
---

Your content here...
```

## License

MIT
