# Sudharsana Rajasekaran’s portfolio and engineering blog

**Author** Sudharsana Rajasekaran · **Date** 2026-11-18 · **Stage** Concepts brief for owner review

## Overview

A hiring leader arriving at sudharsana.dev should see who Sudharsana is, what he built, and a decision worth discussing in an interview. Lead with **Sudharsana Rajasekaran, Staff Data Engineer**, followed by the customer identity and affiliate pipeline cases. Let the scope of the work make the case for staff and principal-level opportunities. The blog has a different entry point for the same reader. It shows how he works through a real engineering problem, what the build did, and what he would change.

## Analysis

The portfolio puts the portrait, career numbers and an AI question ahead of professional work. In a live browser at 390 × 844, the first direct customer identity link began about 3,372 CSS pixels below the top after fonts settled, with JavaScript both enabled and disabled. The blog organizes posts into category groups and identifies Sudharsana as a “Data Engineer and AI Systems Builder.” Both sites already render HTML with Astro. Their opening copy and reading order are the strongest opportunities for change. [Portfolio](https://sudharsana.dev/) · [Engineering blog](https://blog.sudharsana.dev/) · [Blog product brief](PRODUCT.md)

| Lead story | What a reader should be able to say |
| --- | --- |
| **Customer identity** | Sudharsana built a shared identity foundation. He weighed false merges against duplicates and designed for retention and deletion as source records changed. His résumé account reports tens of millions of source records resolved into 1.8M organizations and a shared customer view for 150+ stakeholders across sales, marketing and fraud. [Published customer identity case](https://sudharsana.dev/work/customer-identity/) |
| **Affiliate pipeline and attribution** | Sudharsana designed, built and deployed the affiliate pipeline. The **channel** recorded 4.9M new customer visits and $5.4M in gross merchandise value in its first production year, according to his résumé account. In a separate contribution, he worked with sales leadership to define last-touch credit across the B2B customer base. When describing both contributions, keep the leadership agreement distinct from the channel’s results. [Published affiliate pipeline case](https://sudharsana.dev/work/affiliate-pipeline/) |
| **Latest build on the blog** | Squad 7 built Hearth at Google Cloud’s Agents for Impact hackathon. Vector search found candidate housing records and explicit rules set aside misleading matches. Credit the team. The live demo went offline when the hackathon resources were removed. The article, recording, poster, captions and transcript are available in the release tested on OCI. Playwright verified playback, seeking and all 49 caption cues in that private preview. The public blog still served the earlier release when checked. [First-hand build log](content/posts/hearth-housing-navigator-hackathon.md) · [Squad 7 original submission](https://github.com/Sudhan30/a4i2026-housing-navigator) |

Both portfolio pages returned their own case titles and canonical URLs publicly. Their source files use a `draft` label shared by the content schema. Use the published cases as the editorial baseline. Keep their résumé provenance next to quoted outcomes and identify the invented examples in their interactive figures.

## Goals vs Non-Goals

- **Portfolio.** Open with the name, staff role and a sentence about the work. Put a descriptive link to the customer identity case in the first phone viewport, with the affiliate case immediately following. On each card pair an engineering decision with who used it or helped shape it. Move personal builds, biography and contact further down the page.
- **Blog.** Keep “Resolving dependencies, one idea at a time.” and a first-person introduction about systems Sudharsana has built and operated. Follow it with a prominent Hearth poster, separate “Watch the recording” and “Read the build log” actions, and an archive ordered newest first across categories. Use each post’s date, linked title and short summary. Keep topic and category routes for deeper browsing. Read the recording, poster and captions from the featured build’s own entry. If a later build lacks media, show its article link.
- **Professional visual direction.** Start with a common nameplate and Portfolio / Blog navigation, Geist typography, warm neutral surfaces, dark ink and one deep teal accent for links and focus states. Use the same spacing and caption styles. Give the portfolio room for a labeled matching diagram or an attribution example. On the blog, give that space to the recording and a comfortable column of prose. Phone archive rows stack naturally and support keyboard focus. Ask the owner to judge the accent, type and density in paired desktop and phone previews.
- **Discovery, attribution and citation.** Ordinary links should lead from either site to the original work. Both sites should identify the author with the same full name, role, profile URL and stable Person identifier. Each original should have a self-canonical URL, a visible author, a date where known, descriptive headings and a passage that keeps the decision, outcome and its qualification together. Align structured data with visible copy. Keep published URLs discoverable through sitemaps and blog RSS. [Google Search guidance for AI features](https://developers.google.com/search/docs/appearance/ai-features) · [Article authorship guidance](https://developers.google.com/search/docs/appearance/structured-data/article)
- **Scope.** The project covers two existing sites and their presentation of published work. A combined deployment, new CMS, agent endpoint, duplicated articles, new professional claims, a revived Hearth service and guarantees of external citations are outside the proposal.

A possible first screen puts the name and role above a plain first-person introduction. *“I build data platforms that help teams agree on who their customers are and how to measure the work.”* The first link could read **How I built a shared customer identity for sales, marketing and fraud**. On the blog, keep the tagline above the fold and credit the newest recording to the people who built it. These are working copy examples for the design.

For SEO and AI discovery, a practical test query is *“What did Sudharsana Rajasekaran build for customer identity, and who used it?”* A reader or retrieval tool should be able to answer from one passage and link directly to the case. After release, use available Search Console data to compare branded and topic queries with a dated baseline, and track referrals where available. Use rankings and citations to evaluate discoverability over time. Paid search would need its own audience, budget and authorization. [Google Search measurement guidance](https://developers.google.com/search/docs/appearance/ai-features) · [OpenAI search crawler guidance](https://developers.openai.com/api/docs/bots)

## Alternatives Weighed

| Choice | Trade-off |
| --- | --- |
| **Keep the two Astro sites and share a small visual and author specification** *(proposed)* | At review time the portfolio pins Astro 7.3.5 with Motion 13.5.0, and the blog lockfile resolves Astro 7.4.13, the current stable release. The static portfolio and the server-rendered blog can release independently. The blog can keep React/Astryx islands, Bun APIs and consent controls. Matching the nameplate, tokens and author fields requires checking both implementations when the design changes. [Blog layout](src/layouts/Base.astro) |
| Rebuild both on a new framework or shared runtime | A single component library would ease global changes. Migration and synchronized releases would add work across case routes, article interactions and deployment without moving the evidence closer to readers. |
| Limit the change to typography and color | This has a small implementation cost. It leaves the decision-making evidence several phone screens down and sends readers through separate categories to find the newest post. |

## Key Decisions & Staging for Next Steps

Use native article links throughout. In supporting browsers, a card title or cover may settle into its article with a brief transition. Readers who request reduced motion should navigate immediately with zero added animation delay. The article, its text and its canonical URL must work on direct entry and after Back. Use poster-first, user-initiated playback so the featured recording adds no initial video transfer. [Astro navigation and view transitions](https://docs.astro.build/en/guides/view-transitions/)

Proposed acceptance checks for the design and eventual implementation:

| Reader or surface | Check |
| --- | --- |
| Hiring leader | At 390 × 844 and on desktop, find the full name, staff title and direct customer identity link in the first viewport. Within a 30-second skim, identify one hands-on contribution, one architecture decision and one cross-team decision, then open the supporting cases. |
| Practitioner on a phone | At 320 and 390 CSS pixels, find the newest build and scan the archive without sideways page scrolling or a category selection. Check long titles, code, diagrams and tables. Play Hearth with captions, open its transcript and article, and inspect the network trace for zero recording bytes before Play. If media fails, the article and transcript remain reachable. |
| Keyboard and motion preferences | Open an archive item with Enter, verify its heading and use Back to resume browsing. Repeat with reduced motion, JavaScript disabled and a browser without transition support. Check text contrast and visible focus in the available themes. |
| Search and retrieval | Starting with homepage HTML and following ordinary links, extract each case’s author, canonical URL, decision and qualified outcome. The affiliate excerpt must preserve the first-year timeframe, GMV unit and separate leadership contribution. Check production-generated canonicals, robots directives, Person references, sitemaps and RSS against visible pages. Test the public origin after release as well as the preview. |
| Existing readers | Exercise old case and post URLs, homepage fragments, category and tag links, feed item identifiers, theme and consent choices, newsletter, likes and comments. The archive and article should stay readable when engagement counts are unavailable. Test cross-site links while each site is on its own release schedule. |

**Next owner step.** Select `egm-draft` to turn this brief into the cross-site design and link the relevant architecture decision record. Settle the visual treatment in paired previews and define the latest-build selection rule for future posts. The owner then selects `egm-review` and `egm-resolve` and approves the design in a PR before implementation. Each site’s code PR links the approved design. Run `egm-drift-report` on the design before release and verify the live reader journeys after deployment.

**Brainstorm reviewers.** Design critic, codebase details, zoom-out, comprehension, implementation readiness, structural and inventive catalyst all completed independent reviews.
