# Portfolio and blog architecture decision

**Status** Proposed for design review · 2026-11-18

## Context

The portfolio presents professional case studies as static pages. The blog serves Markdown articles and reader interactions. Both represent Sudharsana Rajasekaran and already have public links that readers use.

## Decision

Keep the two Astro applications independently releasable. Each renders the same public author name, staff title and portfolio profile identifier in its own HTML. A shared visual specification covers type, navigation, spacing and focus. Each site can render its case studies or articles while the other is unavailable.

On the blog, order posts by publication date descending and slug ascending. The first entry marked `featured: true` leads the homepage. Its recording link uses its own media. A featured essay can take the lead, and an empty feature set leaves the complete chronological archive available.

## Consequences

Each site’s implementation PR needs to check its byline and metadata against the common specification. A hiring reader or search tool can follow the public links to a case and quote it with its author and qualifications. Content editors can change the homepage feature using existing Markdown fields. The design includes playback, keyboard, mobile and independent-release checks. [Full design](../designs/portfolio-blog-rebrand.md)
