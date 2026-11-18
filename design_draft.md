# Sudharsana Rajasekaran’s data engineering portfolio and blog

**Author** Sudharsana Rajasekaran

**Status** Draft · Technical plan and alternatives approved · Detailed implementation for review

**Date** 2026-11-18

**Design brief** [Portfolio and engineering blog rebrand](concepts_brief.md)

## Overview

A hiring leader who lands on either site should be able to say what Sudharsana built, which decision he owned, and who relied on the result. The portfolio introduces him as **Sudharsana Rajasekaran, Staff Data Engineer**. It leads with two professional cases that demonstrate his scope as an engineer, architect and technical leader. The blog keeps **“Resolving dependencies, one idea at a time.”** and a first-person introduction. It gives practitioners a place to inspect the builds, trade-offs and lessons behind his work.

The two sites should feel like the work of the same author. A person reading on a phone and a search tool reading page text should both be able to follow a claim to the original case, identify its author and preserve its meaning when quoting it.

## The Problem

In the 390 × 844 phone check recorded in the brief, the portfolio’s first direct link to the customer identity case appeared 3,372 pixels down the page. The case itself contains the interview-worthy decision. Merging different businesses could give sales and fraud teams the wrong customer history. Leaving a duplicate could hide a useful signal. A visitor has to scroll through several screens before finding out how Sudharsana weighed those costs. [Customer identity case](https://sudharsana.dev/work/customer-identity/)

Attribution matters as much as visibility. The affiliate channel recorded 4.9 million new customer visits and $5.4 million in gross merchandise value in its first production year. Sudharsana designed, built and deployed the pipeline that measured the channel. His work with sales leadership to define last-touch credit was a separate contribution. A headline that gives him personal credit for generating the GMV would misrepresent both achievements. [Affiliate pipeline case](https://sudharsana.dev/work/affiliate-pipeline/)

The blog groups writing by category. Someone arriving for a recent build has to know where to look. Hearth also shows why the article matters after a demo ends. Its hosted application went offline, while the recording, captions, transcript and account of the team’s decisions remain useful. [Hearth build log](content/posts/hearth-housing-navigator-hackathon.md)

## Goals

1. **Make the evidence easy to find.** At 390 × 844 and on desktop, the portfolio’s opening screen shows the full name, staff title and a direct link to the customer identity case. The affiliate case follows. After a 30-second skim, a hiring reader should be able to name a system Sudharsana built, an architecture choice he made and a decision he reached with another team, and open the case supporting each answer.
2. **Make authorship and outcomes citable.** From either homepage, a reader or retrieval tool can follow ordinary links with JavaScript disabled and identify the author, original page address, decision and qualified outcome. The customer identity passage keeps the 1.8 million organizations and 150+ stakeholders in context. The affiliate passage identifies whose results the figures describe and the period they cover. Page metadata agrees with the visible text.
3. **Make the newest work accessible on a phone.** On the blog, readers can open the newest featured post, watch its recording when available, and browse a newest-first archive across categories. At 320 and 390 pixels wide, long titles remain legible without sideways page scrolling. Hearth credits Squad 7, offers captions and a transcript, and transfers video bytes only after the reader chooses playback.
4. **Keep navigation predictable.** Both sites use a recognizable author name and clear links between work and writing. Keyboard users can open a case or article and return to their place. A reader who requests reduced motion gets immediate navigation. Existing public links, feeds, likes, comments, theme and consent choices continue to work.
5. **Measure discovery.** After release, verify that public pages expose the evidence above, then compare branded and subject queries against a dated baseline in Search Console where available. Track search and AI referrals where the data permits. Use those observations to guide later editorial changes.

## Non-Goals

The rebrand uses published work and the documented staff title. New career claims, paid search campaigns, an on-site AI assistant, and guarantees of rankings or citations fall outside this design. Restoring the Hearth application, moving production traffic to OCI and combining the two hosting systems are separate projects.

## Technical Plan

### Where the pages come from

The portfolio publishes static Astro pages. The blog renders Astro pages from Markdown and uses React for interactions such as likes and comments. Both can publish the author, project evidence and links in the HTML a reader receives on the first request. Each site owns its content and can release separately.

```text
Portfolio work collection → case summary + decision + source → portfolio home and /work/<slug>/
                                                                        ↕ ordinary links
Blog Markdown → date-ordered post index → featured post + archive → /post/<slug>
                                                                     ├─ recording and captions
                                                                     └─ existing engagement API
```

### Portfolio entry and case pages

In the portfolio repository, `design-package/src/pages/index.astro` already reads the work collection, and `ProfessionalWork.astro` receives the professional entries in editorial order. Move that section directly below the introduction. Update the entries’ existing order values to lead with customer identity, followed by affiliate attribution. Put the first case link before the portrait or diagram on phones. Keep the established work, notes, experience and contact anchors so inbound links still land on the corresponding sections.

Use the case entries for card copy. For customer identity, show the matching decision and the people relying on it. For the affiliate pipeline, identify the channel as the subject of the first-year figures. In `design-package/src/pages/work/[slug].astro`, put the visible author, decision and its context before the interactive figure. Use the existing evidence note to qualify the figures and the figure caption to identify illustrative data. Readers can then quote a passage or understand the work with the figure closed or JavaScript disabled. The current work schema gives published cases the label `draft`; keep routing based on the same collection used by the production build.

### Blog entry, archive and recording

The homepage reads the post index from `server/lib/posts.ts`. Order posts by publication date, newest first, with ties broken by slug in ascending order. The first entry with `featured: true` leads the homepage, whatever its category. Hearth qualifies today. A newer featured essay takes its place when published, even if the essay has no video. If no post is featured, the archive follows the introduction directly.

Place the featured post below the tagline and first-person introduction. Its linked title opens the article. If it has a recording, its poster and a separate **Watch the recording** link lead to the player in that same article. Use only the selected post’s media. On the homepage, load the poster alone. At the article anchor, a recording link works without JavaScript. With JavaScript enabled, activating Play attaches the source and captions to a native inline player with controls. The transcript remains readable if playback fails.

Follow the feature with a chronological archive of all posts, including the featured one. Use each row’s title, excerpt, date and slug. Keep category and tag pages accessible. Resolve existing homepage category queries to the matching list, fall back to all posts for unknown or empty categories, and preserve meaningful targets for old section fragments.

### Shared appearance, navigation and authorship

Use each site’s existing layout and stylesheet for the common nameplate, Portfolio and Blog links, Geist typography, warm neutrals, deep teal links and visible focus treatment. Compare both sites side by side at phone and desktop sizes before committing the palette. Give the portfolio diagrams room to explain decisions. On the blog reserve that space for the recording and a readable text column. Navigation between domains uses ordinary links and works with either site released first.

For same-origin card-to-article links, use a brief native cross-document transition where the browser supports it. Opt in on both documents and animate only the corresponding visible title or cover. Reduced-motion mode uses ordinary immediate navigation. Native navigation also gives each post a fresh document. This matters because the current like buttons share a module-level store that initializes its post slug once. Test post A → post B → Back, keyboard focus, scroll restoration and independent engagement on the two slugs.

Use the portfolio homepage as the author profile URL and give Sudharsana one stable Person identifier on both sites. The portfolio’s `design-package/src/content/site.ts` and blog’s `src/lib/site.ts` hold their local copies of the published name, role and profile links. Each `Base.astro` uses those values in visible navigation and page metadata. Case and article pages link their bylines to the profile, use their own canonical page URL, and reference the same author identifier in structured data. Preserve team credit in the text and descriptions of collaborative projects. Preview indexing controls, published redirects, sitemap URLs and RSS identifiers follow each site’s existing release path.

### Failure behavior and interfaces

The archive and lead case must render when the engagement database is slow or unavailable. Today the blog homepage waits for post statistics alongside the index. Render the homepage from the content index, then use the existing `/api/posts/stats` request to fill in counts when available. Omit unknown counts so readers can distinguish missing data from a measured zero. Post reactions and discussion continue to use the existing API, stable post slugs and identity keys. This design needs no database migration, cross-domain session or new public API.

## Alternatives Considered

The approved plan keeps the portfolio and blog on their existing Astro builds. They share a visual and authorship specification. Each implements it locally and can publish independently. This puts the cost of coordination in paired previews and checks on author details. [Alternatives weighed in the concepts brief](concepts_brief.md#alternatives-weighed)

| Alternative | Benefit | Reason for rejection |
| --- | --- | --- |
| Rebuild both sites on a new framework or shared runtime | One component change could update both sites. | Rejected by author: the portfolio already publishes static case pages and the blog renders articles with working engagement features. A migration would require retesting both delivery paths and would couple releases without improving how quickly a reader can find the evidence. |
| Limit the rebrand to typography and color | Styling changes could ship with few changes to the templates. | Rejected by author: the customer identity link would still be about four phone screens down, and a blog reader would still have to browse categories to find recent work. Meeting the approved goals requires changing the reading order. |
| Add a separate build marker in Markdown | An editor could reserve the homepage feature for build logs and highlight essays elsewhere. | Rejected by author: the homepage should follow the existing editorial choice, including when the newest featured entry is an essay. A second marker would require backfilling posts and maintaining two flags. |

## Detailed Implementation Plan

Paths below start at the root of the named repository. The portfolio application lives in `design-package/` within `my-portfolio-website`. The blog application lives at the root of `my-blog-site-sudhanverse`.

1. **Record the cross-site agreement.** In the blog design PR, create `docs/decisions/portfolio-blog-rebrand.md` alongside the final design at `docs/designs/portfolio-blog-rebrand.md`. Link the two in both directions. The decision record covers independent Astro releases, the common author identity and the newest-featured rule. Both implementation PRs link the approved design. Compare paired phone and desktop previews for typography, focus, spacing, contrast and the deep teal accent.

2. **Put the portfolio evidence in reading order.** Modify these portfolio files.
   - `design-package/src/content/site.ts` and `design-package/src/pages/index.astro` supply the full name, staff title and first-person introduction, then place the professional work directly below it. Give the first direct case link room in the opening phone viewport. Retain navigation targets for work, notes, biography and contact.
   - `design-package/src/content/work/customer-identity.md`, `affiliate-pipeline.md` and `gtm-agents.md` in the same directory receive professional order values 1, 2 and 3 respectively. Use the first two entries’ existing decision, summary, metrics and caption fields for public copy. Qualify the numbers in reader-facing language and keep internal source notes in the entries. Attribute first-year visits and GMV to the affiliate channel.
   - `design-package/src/components/ProfessionalWork.astro` renders a linked title, decision and outcome before optional artwork. `design-package/src/pages/work/[slug].astro` places a visible author link and the case’s decision and evidence before its figure. Keep illustrative records labeled and retain direct case URLs and playable figures.

3. **Apply the common identity to the portfolio.** Modify `design-package/src/layouts/Base.astro` for the nameplate, navigation, full-name titles, social description and author metadata. Use the portfolio homepage as the profile URL and its stable fragment `https://sudharsana.dev/#person` as the author identifier. Keep the page’s own canonical URL. Use the existing production-only metadata switch and preview indexing controls.
   - Modify `design-package/src/styles/global.css` and `design-package/src/styles/resume-stories.css` for the page hierarchy, text measure, card order, responsive layouts and focus states. Use the existing local font delivery mechanism for Geist. Modify `design-package/package.json` and `design-package/package-lock.json` to pin its Fontsource package, and add the corresponding upstream license at `design-package/public/licenses/geist-OFL.txt`. Retain existing font licenses for assets still distributed.
   - Update `design-package/public/social.png` and its matching alt text in the layout so shared links show the same professional identity. Retain the 1200 × 630 dimensions. Regenerate the tracked root `firebase.json` with the existing production build because its hashes depend on the rendered structured data. Preserve the current resource and connection restrictions.

4. **Build the blog homepage from published content.** Modify `server/lib/posts.ts` to break equal-date ties by ascending slug. In `src/pages/index.astro`, select the first featured index entry, render the full archive in the same order and remove the homepage’s blocking call for engagement statistics. Keep newsletter, topics, feedback and category navigation reachable. For recognized, populated `?category=` values, filter the archive in the server response so a direct visit works without JavaScript. For unknown or empty categories render all posts. Preserve the old `#hackathons`, `#open-source` and `#latest` entry points on the homepage.
   - Create `src/components/FeaturedPost.astro` for a linked title, excerpt, optional poster and recording link. Only render the recording action for an entry with its own video. Without a featured entry, render the archive directly.
   - Modify `src/components/PostRow.astro` to render compact linked archive rows while respecting its existing callers on other lists. In `src/components/Engagement.astro` distinguish “awaiting statistics” from a known count. Modify `src/scripts/site.ts` to fill valid counts from the existing batch endpoint and leave unknown values hidden. A failed request must not hide the story or turn an unknown value into zero. Replace the old home section-filter listeners with ordinary navigable category links.

5. **Connect blog reading, playback and author attribution.** Modify the following blog files.
   - `src/lib/site.ts` defines the shared identity values locally. `src/layouts/Base.astro` uses them for the visible shell and structured metadata. `src/pages/post/[slug].astro` links the visible byline to the portfolio and adds the matching identifier to the existing article author object. Preserve article canonical URLs, publication dates, theme, consent and RSS discovery.
   - In the post template, give recordings the stable `#recording` anchor targeted by the homepage. Expose a real link to the post’s own video, preserve the transcript in readable HTML and keep track information with its post. Modify `src/scripts/post.ts` to enhance the recording link on activation. Attach the media and any declared captions once, provide native controls, and keep the recording link accessible if playback fails. Text-only posts render as ordinary articles.
   - Modify `src/styles/site.css` for shared identity, mobile archive rows, poster proportions, keyboard focus and a brief same-origin card transition. Use matching, unique transition names for the chosen link and destination. Where a featured item also appears in the archive, assign a transition identity to only one representation at a time. Scope motion to supported browsers and readers who allow it. Native links handle navigation and Back in all cases. Keep existing React islands, storage keys and post slugs.
   - Update `PRODUCT.md` to describe the approved reading order and feature rule for future editors. Existing Markdown posts already carry the required fields. Their URLs, media assets and database records need no conversion.

6. **Verify the reader journeys using production builds.**
   - **Portfolio checks.** Update `design-package/scripts/validate.mjs` for the Geist license and existing preview restrictions. Update `design-package/scripts/browser-check.mjs` for the new reading order, current headings, keyboard and reduced-motion behavior. Update `scripts/validate-production.mjs` for the exact author ID and visible/metadata agreement, preserving its privacy, CSP, redirect and artifact checks. Extend `scripts/production-browser.mjs` to measure the direct case link after fonts settle at 390 × 844, with and without JavaScript. Check title, role and link fit in the viewport. Have a reader describe one contribution, architecture choice and cross-team decision after the 30-second skim. Record what the reader found separately from the automated result.
   - **Blog checks.** Add `tests/featured-home.test.ts` using Bun’s existing test runner. Serve the built site with isolated Markdown fixtures and temporary standalone storage. Exercise multiple featured entries, equal dates, a newer unfeatured post, a featured essay without media, an empty feature set and category deep links. Assert selected title, article href, eligible recording link and archive order in the HTML. Add this focused suite to `.github/workflows/docker.yml` after the production build.
   - **Browser and interaction checks.** Use the installed Playwright against a production preview. Test at 320, 390 and 1440 pixels, in light and dark modes, with keyboard input, JavaScript disabled and reduced motion. Inspect media requests before Play, confirm Hearth plays and seeks with captions, and open the transcript. Exercise post A → post B → Back, old links, RSS and sitemap. Verify post and comment likes, comment submission and reload persistence against isolated PostgreSQL. Test consent, newsletter and feedback against isolated services. Delay or fail the stats request and confirm readers can still open articles.
   - **Commands and artifacts.** In the portfolio use the repository’s Node 24 toolchain, run `npm run check`, the design-package preview build and validators, then `npm run build` and `npm test` at the root. Serve the exact build locally and run `scripts/production-browser.mjs` against it. In the blog run `bun install --frozen-lockfile`, `bun run build` and `bun test tests/featured-home.test.ts`. Save paired screenshots, test outcomes and the two revision identifiers with the PR evidence. The production portfolio build generates the release manifest and provenance through the existing scripts.

7. **Release independently and verify attribution.** Each site can go first because the public case URLs, original post URLs and profile URL already exist. Exercise both directions across the domains with one site upgraded at a time. Before release, run the owner’s EGM drift check on the finalized design. After each deployment, fetch the public pages, follow the links from their rendered HTML, verify author and canonical data, and check the affected reader journey with Playwright. Use each site’s existing release mechanism to return to its previous verified artifact if necessary. The blog cutover to OCI follows its separate migration decision. Compare available Search Console and referral data with the dated baseline after recrawling.
