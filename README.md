# Sudhanverse — Engineering, Hackathons & Open Source Blog

The source code powering **[blog.sudharsana.dev](https://blog.sudharsana.dev)** — built with **Bun**, TypeScript, server-side rendered HTML, interactive client-side architecture playgrounds, and dual-mode persistence (PostgreSQL in production, zero-config local JSON storage in development).

## Three-Pillar Content Architecture

1. **Open Source (`/category/open-source`)** — Flagship open-source launches such as **BabbleFlow** (native Kotlin + Jetpack Compose Android voice keyboard with Whisper + Gemma 4), complete with interactive pipeline & routing simulators.
2. **Hackathons (`/category/hackathons`)** — Winning builds from AI hackathons (**HealthForce** 1st Place Snowflake × Anthropic, **Recall Storm** 3rd Place Google DeepMind Gemini 3) with playable agent workflow visualizers.
3. **Engineering Deep Dives (`/category/engineering`)** — Self-hosted K3s infrastructure, LangGraph Text-to-SQL agents, and AI systems architecture.

## Features

- **Zero-Config Standalone Mode**: Runs out-of-the-box with `bun run dev` using local JSON storage (`./data/`) when `DATABASE_URL` is not set.
- **Production PostgreSQL Mode**: Automatically initializes and reconciles its PostgreSQL schema on startup when `DATABASE_URL` is provided.
- **Full Engagement System**: Post likes (with optimistic UI & server reconciliation), threaded/paginated comments, comment likes, custom username syncing, and newsletter subscriptions.
- **Local AI Integration (Ollama)**: Generates whimsical reader aliases and synthesizes "AI Reader Pulse" summaries of article discussions using local Gemma models (`OLLAMA_MODEL`, defaults to `gemma4:latest`), with deterministic fallbacks when Ollama is offline.
- **Interactive Post Playgrounds**: Embedded interactive simulators for BabbleFlow, HealthForce, Recall Storm, and Text-to-SQL LangGraph directly inside articles.

## Quick Start (Standalone / Open Source)

```bash
# 1. Install dependencies
bun install

# 2. Start development server (uses ./data/*.json automatically if DATABASE_URL is unset)
bun run dev
```

Visit **http://localhost:3000**.

## Environment Variables

Copy `.env.example` to `.env` if you want to connect to PostgreSQL or a local Ollama instance:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `3000` |
| `DATABASE_URL` | Optional PostgreSQL connection string | Unset (uses `./data/*.json`) |
| `OLLAMA_URL` | Optional Ollama endpoint for AI summaries & usernames | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model tag | `gemma4:latest` |

## Adding or Editing Posts

Create a Markdown file in `content/posts/` with frontmatter:

```markdown
---
title: "Post Title"
date: "2026-04-20"
category: "open-source" # "open-source" | "hackathon" | "engineering"
tags: ["Android", "Kotlin", "Open Source"]
excerpt: "One-sentence summary shown on cards and SEO meta tags."
slug: "my-post-slug"
featured: true
cover: "/assets/images/my-post/cover.png"
badge: "Open Source · v1.0.0"
event: "Optional Event or Subtitle"
repoUrl: "https://github.com/..."
releaseUrl: "https://github.com/.../releases"
highlights: ["Highlight 1", "Highlight 2"]
---
```

## License

MIT
