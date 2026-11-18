# Sudharsana Rajasekaran’s data engineering portfolio and blog

**Author** Sudharsana Rajasekaran

**Status** Draft · Overview and goals approved · Technical plan for review

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
3. **Make the newest work accessible on a phone.** On the blog, readers can watch the featured build’s recording or open its article, then browse a newest-first archive across categories. At 320 and 390 pixels wide, long titles remain legible without sideways page scrolling. Hearth credits Squad 7, offers captions and a transcript, and transfers video bytes only after the reader chooses playback.
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
Blog Markdown → date-ordered post index → latest build + archive → /post/<slug>
                                                                     ├─ recording and captions
                                                                     └─ existing engagement API
```

### Portfolio entry and case pages

In the portfolio repository, `design-package/src/pages/index.astro` already reads the work collection, and `ProfessionalWork.astro` receives the professional entries in editorial order. Move that section directly below the introduction. Update the entries’ existing order values to lead with customer identity, followed by affiliate attribution. Put the first case link before the portrait or diagram on phones. Keep the established work, notes, experience and contact anchors so inbound links still land on the corresponding sections.

Use the case entries for card copy. For customer identity, show the matching decision and the people relying on it. For the affiliate pipeline, identify the channel as the subject of the first-year figures. In `design-package/src/pages/work/[slug].astro`, put the visible author, decision and its context before the interactive figure. Use the existing evidence note to qualify the figures and the figure caption to identify illustrative data. Readers can then quote a passage or understand the work with the figure closed or JavaScript disabled. The current work schema gives published cases the label `draft`; keep routing based on the same collection used by the production build.

### Blog entry, archive and recording

`src/pages/index.astro` reads the date-ordered index from `server/lib/posts.ts`. Place a build preview below the tagline and first-person introduction. Follow it with one archive of all posts, including the featured one, so archive membership stays predictable. Use the existing title, excerpt, date and slug for each row. Sort equal publication dates by slug for a repeatable order. Category and tag pages remain destinations. Resolve existing home category queries to the matching list, fall back to all posts for unknown or empty categories, and preserve meaningful targets for old section fragments.

Introduce a small Astro build-preview component. It receives one post and takes its poster, video and captions from that entry. Two distinct actions serve different readers. **Watch the recording** opens the article at a stable player anchor. **Read the build log** opens the article at its title. The homepage loads the poster only. At the article anchor, a recording link works without JavaScript. With JavaScript enabled, activating Play attaches the source and captions to a native inline player with controls. Until activation, the page contains no player source that can trigger a media request. The transcript remains ordinary article content, including when video playback fails. A build without a recording offers the article link alone.

**Owner decision — which entries qualify for the preview?** Both rules below select Hearth in the present collection. Both allow a future build without video. If no entries qualify, the archive follows the introduction directly.

| Rule | How it works | Trade-off and failure case |
| --- | --- | --- |
| Newest featured post | Use the newest entry with the existing `featured: true` field. Mark the next build as featured when publishing. | Uses existing content as written. An essay marked featured would occupy the build slot, and an unmarked build would be missed. |
| Newest post marked as a build | Add an optional `build` field to the Markdown reader and mark existing build entries during implementation. Select the newest marked entry regardless of category or featured status. | Keeps editorial highlights independent of build membership. An omitted mark leaves a build in the archive but out of the preview. |

### Shared appearance, navigation and authorship

Use each site’s existing layout and stylesheet for the common nameplate, Portfolio and Blog links, Geist typography, warm neutrals, deep teal links and visible focus treatment. Compare both sites side by side at phone and desktop sizes before committing the palette. Give the portfolio diagrams room to explain decisions. On the blog reserve that space for the recording and a readable text column. Navigation between domains uses ordinary links and works with either site released first.

For same-origin card-to-article links, use a brief native cross-document transition where the browser supports it. Opt in on both documents and animate only the corresponding visible title or cover. Reduced-motion mode uses ordinary immediate navigation. Native navigation also gives each post a fresh document. This matters because the current like buttons share a module-level store that initializes its post slug once. Test post A → post B → Back, keyboard focus, scroll restoration and independent engagement on the two slugs.

Use the portfolio homepage as the author profile URL and give Sudharsana one stable Person identifier on both sites. The portfolio’s `design-package/src/content/site.ts` and blog’s `src/lib/site.ts` hold their local copies of the published name, role and profile links. Each `Base.astro` uses those values in visible navigation and page metadata. Case and article pages link their bylines to the profile, use their own canonical page URL, and reference the same author identifier in structured data. Preserve team credit in the text and descriptions of collaborative projects. Preview indexing controls, published redirects, sitemap URLs and RSS identifiers follow each site’s existing release path.

### Failure behavior and interfaces

The archive and lead case must render when the engagement database is slow or unavailable. Today the blog homepage waits for post statistics alongside the index. Render the homepage from the content index, then use the existing `/api/posts/stats` request to fill in counts when available. Omit unknown counts so readers can distinguish missing data from a measured zero. Post reactions and discussion continue to use the existing API, stable post slugs and identity keys. This design needs no database migration, cross-domain session or new public API.
