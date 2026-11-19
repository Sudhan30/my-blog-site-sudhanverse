# Revamp the entire blog as an Astryx engineering publication

Redesign every public page on **blog.sudharsana.dev**. The homepage should feel like the front of an engineering publication, the archive should be easy to scan, and long articles should give diagrams, code, and technical decisions room to breathe. The portfolio stays outside this release.

### Visual direction

- Keep **“Resolving dependencies, one idea at a time.”** as the masthead. Bring **Sudharsana Rajasekaran · Staff Data Engineer** into the same opening composition. Follow it immediately with the lead story, so a phone reader can reach the work quickly.
- Build on the blog’s installed Astryx Neutral theme and React 19 integration. Use Geist for headlines and prose, Geist Mono for dates and code, warm paper and charcoal surfaces, and deep teal for links, focus, and selected states. Define these once for light and dark modes. Astryx supports this through theme variables and prebuilt component CSS. [Astryx repository](https://github.com/meta/astryx)
- Give the featured story one large image. Use typography, spacing, and fine dividers for archive entries. Reserve motion for navigation and deliberate interactions, with immediate transitions under reduced motion.

### Page and component changes

| Surface | Design |
|---|---|
| **Header, mobile navigation, and footer** | Use one masthead across all routes. Give Writing, Topics, Portfolio, RSS, and the theme switch consistent placement. Use Astryx Link, Icon Button, Stack, and Divider where appropriate. Keep mobile navigation operable by keyboard and basic links available without JavaScript. |
| **Homepage** | Make the newest `featured: true` post the lead story. On desktop, pair the headline and editorial summary with its poster. On phones, put the headline before the image. Give Hearth separate **Read article** and **Watch recording** links. A featured essay without video gets the article link alone. |
| **Archive, category, tag, search, and 404** | Use one article-row design with title, concise summary, date, and reading time. Keep archive search as a labeled GET form with shareable query and category URLs. Use Breadcrumbs and Empty State for orientation and recovery, including a clear path back to all writing. |
| **Article pages** | Give the headline, byline, and publication details a consistent hierarchy. Keep prose near 65–72 characters per line and allow diagrams, tables, and video to use more width. Preserve the collapsible phone contents menu, desktop section rail, stable section URLs, captions, transcript, and progress through the article text. |
| **Interactive surfaces** | Apply the shared theme to likes, comments, sorting, pagination, newsletter, consent, feedback, image zoom, and all four article playgrounds. Keep the existing Astryx controls where they already work. Preserve visible loading, success, and error states, plus focus restoration when dialogs close. |

Use the official component library for presentation and controls. Render article content, links, headings, and search results as HTML through Astro. Hydrate only interactions that require browser state. This preserves the blog’s readability for search engines, AI readers, and visitors with JavaScript disabled. [Astryx component catalog](https://astryx.atmeta.com/components)

### Verification and release

1. Capture before-and-after views of the homepage, Hearth, an engineering article, category and tag pages, search results, and 404 at **320, 390, 900, and 1440 pixels**. Check reading order, contrast, visible focus, long titles, and horizontal overflow.
2. Run Playwright in Chromium and Firefox across light, dark, reduced-motion, and JavaScript-disabled sessions. Exercise search and Back navigation, section deep links, video playback and captions, playground controls, likes and comments, and feedback-dialog keyboard behavior. Verify that Hearth transfers zero video bytes before Play.
3. Check rendered HTML for author identity, canonical URLs, article metadata, and crawlable links. Preserve existing URLs, feeds, API contracts, reader data, and OCI hosting.
4. Merge through a blog PR after CI passes. Test the exact merged image on OCI before promotion, retain the previous image for rollback, and repeat the public reader checks after deployment.

[Related architecture decision](../decisions/portfolio-blog-rebrand.md)
