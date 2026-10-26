# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers and engineering leaders evaluating Sudharsana Rajasekaran during a job search. They arrive from a resume, LinkedIn or a referral, skim for a few minutes, and decide whether this is a senior engineer worth interviewing. Secondary: practitioners who read a whole post for its technical depth.

## Product Purpose

A personal engineering blog at blog.sudharsana.dev: write-ups of data systems, AI agents, homelab infrastructure and hackathon builds. Success is a hiring manager leaving convinced of senior engineering judgement: real systems, real trade-offs, shipped work.

## Positioning

Every post is a first-hand build log of something actually running or shipped (a self-hosted k3s cluster serving this site, agents built and demoed at hackathons, one of them a winner), not tutorials or opinion pieces.

## Operating Context

Read on desktop during evaluation and on phones from LinkedIn links. Posts are long technical write-ups with architecture SVG diagrams, code, tables and, for hackathon posts, demo videos with poster images.

## Capabilities and Constraints

- Bun + TypeScript SSR, no framework. Templates are template strings in `server/templates/layout.ts` and `server/routes/*.ts`; one stylesheet `public/styles/main.css`.
- Markdown posts in `content/posts/` with frontmatter (title, date, tags, excerpt, slug, readTime, featured, cover, video, poster, badge, event). One custom-template post in `server/templates/posts/`.
- Features to preserve: home (hero, featured hackathon posts, post list, about, newsletter signup, topics), post page (video embed, meta, tags, author block, like button, comments with sort, AI comment summary, pagination, image lightbox), tag pages, RSS, sitemap, light/dark theme with system detection, reading progress, feedback modal, cookie consent gating Google Analytics and in-house telemetry.
- Deployed as an image to k3s via Flux (`my-blog-site-cluster-infra`).

## Brand Commitments

- Name: Sudharsana Rajasekaran. Portfolio at sudharsana.dev, GitHub `sudhan30`, LinkedIn `sudharsanarajasekaran`.
- Tagline "Resolving dependencies, one idea at a time." is kept; the owner is open to a stronger alternative if one is proposed.
- Portrait at `public/assets/images/author-potrait-small.png`.
- Visual standard (owner choice, 2026-10-26): a conventional engineering blog at the craft level of the Stripe and Linear blogs, not an expressive or themed world.

## Evidence on Hand

- Seven posts, including two hackathon posts with cover images and a demo video (`public/assets/video/healthforce.mp4`); HealthForce won the Anthropic × Snowflake Intelligence at Work Hackathon.
- Architecture diagrams in `public/assets/images/*.svg`.
- No testimonials, employer logos or metrics beyond what the posts state. Do not invent any.

## Product Principles

1. Signal seniority in the first screen: who, what they build, proof it ships.
2. Respect a skimming reader: titles, dates and one-line summaries scannable without clicking.
3. The writing is the product; chrome never competes with it.
4. Long technical posts must read comfortably: code, tables, diagrams and video are first-class.
