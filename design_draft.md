# Sudharsana Rajasekaran’s data engineering portfolio and blog

**Author** Sudharsana Rajasekaran

**Status** Draft · Technical plan approved · Alternatives for review

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
