---
version: 1
slug: "server-templates-layout-ts"
primary_target: "server/templates/layout.ts"
related_targets: ["server/routes/home.ts","server/routes/post.ts","server/routes/tag.ts","public/styles/main.css"]
---

# Surface brief: blog (home, post, tag)

Scope: the whole blog shell (layout), home, post and tag pages. Visitor mode: Read.

Audience: hiring managers skimming in a few minutes to judge seniority; practitioners reading whole posts. Job: understand who this is and what they ship, then read one post. Constraints: keep every existing feature (see PRODUCT.md); keep the tagline; keep copy unless a layout change removes an element.

Chosen direction: the category standard, played straight (owner chose it over three rolled directions on 2026-10-26). Bar: the Stripe and Linear engineering blogs.

## Direction contract

THESIS: A clean engineering blog at Stripe and Linear craft level. It refuses the current SaaS template look: blue CTA buttons, a stat row, uniform bordered cards, tag pill clouds, kickers above headings, a floating chat bubble.

OWN-WORLD: White ground (deep near-black in dark mode), near-black ink, two greys, hairline rules, one restrained indigo accent used only for links, focus and the subscribe action. Geist for all text, Geist Mono for code and dates. Large tight headings, generous whitespace, lists separated by hairlines rather than cards.

STORY: The visitor sees the name, role and tagline, the two hackathon builds (one a winner) with real covers, then a dated list of writing. They open a post and read comfortably, with a contents list and video, code, tables and diagrams treated as first-class.

FIRST VIEWPORT: Desktop 1440: a slim header with the wordmark on the left and text nav on the right. The hero is left-aligned in a 1120px container: the tagline as H1 at about 64px, a subtitle at about 20px, then a 40px portrait byline with links. The two featured hackathon cards start inside the first viewport. The primary action is the featured post itself, with no button.

FORM: The category standard (canon), not on the rolled list; seed key e5f07f49.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
