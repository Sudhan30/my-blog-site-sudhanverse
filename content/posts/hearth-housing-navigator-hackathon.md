---
title: "Hearth: Finding the Heat Violation Her Court File Doesn't Know About (Google Cloud Agents for Impact 2026)"
date: 2026-11-18
category: hackathon
tags: [hackathon, google-cloud, ai-agents, bigquery, vector-search, gemini, housing]
excerpt: "At Google Cloud's Agents for Impact hackathon, Squad 7 built Hearth: an intake desk that hears a tenant in Spanish, finds the open city violations on her block with BigQuery vector search, sets aside the look-alikes with plain rules, and hands the attorney an editable worksheet before Monday's hearing. We didn't place. Here is what we built, what broke, and what I'd change."
slug: hearth-housing-navigator-hackathon
readTime: 9
cover: /assets/images/hackathons/hearth-cover.jpg
video: /assets/video/hearth.mp4
poster: /assets/video/hearth-poster.jpg
captions: /assets/video/hearth.vtt
featured: true
badge: "Squad 7 · BigQuery Vector Search"
event: "Google Cloud Agents for Impact 2026 · Challenge 02: Housing Stability and Eviction Prevention"
highlights:
  - "Vector Search Proposes, Rules Decide"
  - "Spanish Voice Intake"
  - "33,980 Households a 311 Rule Would Miss"
---

> The city has already cited these conditions. Her court file doesn't know.

At **Google Cloud's Agents for Impact 2026** hackathon, Squad 7 took Challenge 02: an affordable housing stability and eviction prevention navigator. We built **Hearth**, an intake desk for a legal-aid paralegal with twenty minutes and a tenant whose hearing is Monday. **We didn't place.** This post covers what Hearth does, how it is built, what went wrong along the way, and what I would do differently.

**Marisol and Dev in the video are fictional composites. The complaint, violation and Census records are real New York City data. Eviction filing counts are modeled, and labeled as modeled everywhere they appear.**

The live demo went offline when the hackathon’s Google Cloud resources were shut down. You can watch the recorded walkthrough above with narration and captions, or read the transcript at the end of this post.

---

## The problem

A nonpayment case moves fast. A tenant who stopped paying because the heat has been off for weeks often has a real defense, and the evidence for it is frequently sitting in public city records: an inspector already visited the building next door, or her own, and wrote up the violation. Nobody at intake has time to find it.

Keyword search does not help much. Tenants say "the radiators are cold." Inspectors write "provide ready access to heating system." The words do not overlap. The meaning does.

Each squad was also handed one required ingredient. Ours was **BigQuery Vector Search**.

## What we built

Hearth is a chat on the left and a court-style worksheet on the right. The paralegal talks to the tenant; the worksheet fills in as they go.

### Intake by voice, in Spanish

Seventy percent of households in the demo tenant's census tract are Hispanic, so intake cannot assume English. The paralegal presses the mic, the tenant speaks, and Google Cloud Speech-to-Text returns the Spanish transcript. Hearth answers the paralegal in English.

### Vector search proposes, rules decide

This is the centre of the project. The tenant's description is embedded with Gemini and matched against 311 complaints and housing violations near her block. Then plain rules run over the candidates: the record must be residential, still open, and within 800 metres.

For the demo tenant that leaves three open records on her block: mold, a water leak, and an immediately hazardous heat violation the landlord had 24 hours to fix.

The challenge data includes planted look-alikes, and one of them ranked at or near the top by similarity: a mold case that had already been repaired and re-inspected. Citing a repaired condition would hurt the tenant in court. The rules set it aside, and Hearth shows the paralegal what it dropped and why. Asking "why did you set that one aside?" gets a straight answer.

Every record appears on a map with the search radius, so the paralegal can see whether the problems cluster around her building.

### Reading the paperwork

Photograph the court notice and Gemini pulls out the index number, hearing date, arrears and petitioner. It is told never to extract the tenant's name or unit number, and one click puts the rest into the case. A photo of a condition gets a description labeled as a visual estimate, with a list of what a photo cannot prove.

### Relief funds, checked by rules

Four New York City programs are checked with deterministic rules: income against 200% of the poverty line, arrears against the program cap, an open violation where the program requires one. Each check is shown as pass or fail. The model does not decide eligibility. A detail like a child's asthma is noted for the attorney and never used in the decision.

### A worksheet a human can correct

The right panel looks like a filing, on purpose: it is easier to care about a form than a chat log. The paralegal can edit any line, then download it as a fillable PDF that the attorney can keep correcting. It is an internal worksheet, not something filed with the court.

Cases save automatically. The queue is sorted by hearing date, each case shows a countdown and its next action, and the paralegal can ask Hearth "which cases need attention today?"

## Architecture on Google Cloud

```
 Paralegal ──> Intake Desk (React + Astryx, Cloud Run)
                 │   Speech-to-Text · Text-to-Speech · Maps
                 │   Gemini vision (notice, photos) · Firestore (cases)
                 ▼
              Hearth agent (ADK, Gemini 2.5 Flash, Cloud Run)
                 │
     ┌───────────┼───────────────────┐
     ▼           ▼                   ▼
 BigQuery        MCP Toolbox         Rule checks
 AI.EMBED +      tract context,      relief funds,
 VECTOR_SEARCH   relief programs     hearing dates
 then hard rules
```

1. **Agent:** Google's Agent Development Kit in Python, running Gemini 2.5 Flash on Vertex AI, deployed to Cloud Run.
2. **Evidence search:** `AI.EMBED` with a Gemini embedding model and `VECTOR_SEARCH` in BigQuery, followed by SQL rules. Kept and excluded records are both returned, each exclusion with its reason.
3. **Neighbourhood context:** MCP Toolbox for Databases on Cloud Run serves tract-level Census figures and the list of relief programs.
4. **Intake Desk:** React with Meta's Astryx design system, served by a small FastAPI proxy that also fronts Speech-to-Text, Text-to-Speech, the Gemini vision calls and Firestore.
5. **PDF:** generated in the browser with real form fields, so it stays editable after download.

## Honesty rules we kept

- **No demo answers in the prompt.** The agent's instructions contain no case data, and a test fails the build if any appears.
- **No tenant names or unit numbers** are extracted or stored.
- **Real and modeled data are labeled.** Census and city records are real. Eviction filings are modeled and say so on screen.
- **Demographics are never inputs.** Race and ethnicity columns are used only in an audit run after the fact, never in search, ranking or prompts.

That audit found something worth the whole exercise. A rule that only helps tenants who already have an open 311 complaint would skip **37 census tracts holding 33,980 severely rent-burdened households**, places with high eviction pressure and almost no complaints on file. 74.9% of households in those tracts have no vehicle. People who fear retaliation do not file complaints. So Hearth routes those cases to an inspection request and to funds that do not require an open case.

## My part

I built the agent, the evidence search and the Intake Desk, and recorded the demo. I worked with AI coding agents throughout: Google's Antigravity for the first milestones, then Claude Code for the rest. A teammate built a parallel version with photo upload, and I rebuilt that idea into this one.

The video was recorded automatically with Playwright against the deployed app. The narration is synthetic, generated with Google Cloud Text-to-Speech. Not everything in the video existed when the clock stopped; I kept working on it afterwards until it was finished.

## What didn't work (the honest part)

- **My first city pick was wrong.** I chose Cincinnati before looking at the data. It had no habitability narratives to search at all. We switched to New York.
- **The model guessed the hearing year.** Asked about "Monday at 9:30," it picked a date two years in the past. Dates are now resolved in code, and past or unreadable dates are rejected.
- **Speech-to-text and the city disagree on spelling.** The transcript said "Saint Nicolas"; the records say "St Nicholas." The block lookup had to become tolerant of that.
- **A two-minute hang.** A blocking HTTP call inside the async proxy froze a request for 120 seconds before failing. It is now properly async with clear timeout messages.
- **A deleted case came back.** Another browser tab's autosave quietly re-created it. Deletes now leave a marker so stale tabs are told the case is gone.
- **A delete test removed a teammate's saved case.** It was restored from Firestore's point-in-time read. After that, tests only deleted cases they had created.
- **The first PDF was a picture.** It looked right and could not be edited, which defeated the point. It was replaced with a real fillable form.
- **Not tested:** the photo reader was never run against a real photo of a housing condition, only checked for how it labels its limits.

## What I'd do differently

I don't know the judges' reasoning, so this is my own read.

1. **Lead with the one idea.** "Vector search proposes, rules decide" is the project. The demo spends time on voice, maps, photos and PDFs before the audience has absorbed it.
2. **Put the audit number first.** 33,980 households is the strongest thing we found, and it sat in the closing seconds.
3. **Freeze earlier.** Features kept landing late. A smaller demo rehearsed twice beats a bigger one rehearsed once.
4. **Check the data before choosing the scenario.** The Cincinnati detour cost time at the worst moment.

## What I learned

- **Retrieval needs a referee.** Similarity search will rank a repaired violation first. The useful system is the one that says no and explains itself.
- **Keep the model out of decisions that have rules.** Eligibility and dates are arithmetic. Let code do them and let the model talk.
- **Audit your own shortcut.** The obvious rule, "help people with an open complaint," excluded the people least able to complain.
- **Show what was set aside.** The excluded list earned more trust than the results did.

## Transcript

<details class="transcript">
<summary>Read the video transcript (2 min 40 s)</summary>

**0:00** Thursday afternoon. Marisol has a nonpayment hearing on Monday at nine thirty. Her radiators have been cold since early November, there's black mold around the tub, and water comes through the bathroom wall. The city has already cited these conditions. Her court file doesn't know. Dev, the paralegal, has twenty minutes. This is Hearth.

*[The tenant describes her block, her hearing and the conditions aloud in Spanish.]*

**0:37** Seventy percent of households in her census tract are Hispanic, so intake works in Spanish. Google Cloud Speech-to-Text transcribes what she says, and Hearth answers Dev in English.

**0:49** Tenants say the radiators are cold. Inspectors write: provide access to the heating system. BigQuery vector search matches meaning, not keywords. Three open violations on her block, including an immediately hazardous heat violation the landlord had twenty-four hours to fix. But one of the top matches was a mold case that was already repaired. Vector search proposes. Our rules decide, and Hearth shows what it set aside, and why.

**1:17** Dev can challenge any decision. Citing a repaired condition would hurt her in court, and Hearth explains exactly that.

**1:25** Snap the court notice. Gemini reads the index number, the hearing, and the arrears, never the tenant's name. One click puts it into the case, and Hearth rechecks her options.

**1:36** Four New York City relief programs, each checked by deterministic rules, not guessed by the model: income against two hundred percent of poverty, arrears against the cap, an open violation where required. Her daughter's asthma is noted for the attorney, never used to decide eligibility. And the countdown never lets Dev forget the hearing.

**1:55** As they talk, the worksheet fills itself in: the records, the defenses, the referrals, and what still needs proof. The paralegal stays in control. Edit anything, and download it as a fillable PDF for the attorney. Every case is saved in Firestore, sorted by the next hearing, with the next action for each.

**2:15** Real census and city records, with modeled eviction filings labeled as modeled. We audited our own rules: requiring a 311 ticket would skip thirty-seven high-pressure tracts with thirty-three thousand nine hundred eighty severely rent-burdened households, so those families are routed to inspections and funds that don't need an open case. Built on Google Cloud, so Marisol walks into court on Monday with a defense.

</details>

Narration is a synthetic voice from Google Cloud Text-to-Speech. The screen recording is the deployed app, driven by Playwright.

---

Built with Squad 7 at Google Cloud Agents for Impact 2026.

**Code:** [github.com/Sudhan30/a4i2026-housing-navigator](https://github.com/Sudhan30/a4i2026-housing-navigator)
