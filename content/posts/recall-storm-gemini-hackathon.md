---
title: "Recall Storm: 646,825 Tokens, 911 Files, One Generation (Gemini 4 Argon Hackathon)"
date: 2026-10-25
tags: [hackathon, gemini, long-context, ai-agents, verification]
excerpt: "At the Gemini 4 Argon SF Hackathon we asked one continued generation to write a whole retail compliance system for California's Red No. 3 ban, then built a verifier to check it. Every seam held. The plan still had 21,459 mistakes. Here's what that taught me about long-context code."
slug: recall-storm-gemini-hackathon
readTime: 8
video: /assets/video/recall-storm.mp4
cover: /assets/images/hackathons/recall-storm-cover.jpg
poster: /assets/video/recall-storm-poster.jpg
featured: true
badge: "Demo video"
event: "Gemini 4 Argon SF Hackathon · Track 1: Million Token Engineering"
---

> Consistent isn't correct.

On **January 1, 2027**, California bans food containing **Red No. 3** (AB 418), with no sell-through period. Every grocery store in the state gets one overnight shift to pull it from the shelves, even when the label hides it as *erythrosine* or *E127*.

At the **Gemini 4 Argon SF Hackathon** (Track 1, Million Token Engineering) we asked Gemini 4 Argon to write the whole compliance system that clears those shelves overnight. Then we spent the rest of the day checking it.

Everything here was built at the event. Stores, stock and staffing are simulated; every number below comes from our verifier.

## The headline numbers

| | |
|---|---|
| Visible tokens in **one continued generation** | **646,825** |
| Files written, across 10 continuation hops | **911** |
| Cross-file links that resolve (after a 1-line fix) | **6,581 / 6,581** |
| Argument mismatches across 4,881 calls | **0** |
| Longest passing link | test at token **641,687** → function at token **89,603** |

That last row is my favourite. A test written more than half a million tokens later calls a function from near the start of the stream, with the right arguments, and passes.

## The drill

The scenario is a real big-box retailer footprint: 286 California store locations from OpenStreetMap, with the drill run on 20 of them overnight Dec 30-31, 2026. The catalog is **1,212 products**: 1,000 real USDA FoodData Central labels plus 212 adversarial variants and look-alikes we wrote (think "Red 40" next to "Red 3", or E127 buried in a translated ingredient list).

The system has to:

1. read every label and find the Red No. 3 products (including aliases and translations),
2. ignore the **483 look-alikes**,
3. schedule associates to pull every affected shelf without double-booking anyone or working outside their shift,
4. pack the returns onto trucks that fit.

The hidden tests in `acceptance/` never appeared in any prompt.

## Consistent isn't correct

Here is the lesson of the day. The giant generation was **internally consistent**: names, imports and signatures all lined up across 911 files. But when our verifier ran the plan it produced, it found **21,459 mistakes**, mostly people booked at two shelves at once or scheduled outside their shift.

Long context solved *coherence*. It did not solve *correctness*. Those are different axes, and you only see the gap if you build something that checks the output against the world.

## Managed agents as the repair loop

We pointed a managed agent (Antigravity on gemini-4-argon, network disabled) at one failing file at a time, with **half the failures held out** of what it could see. We re-scored everything locally, including stores the agent never saw.

| Job | Result |
|---|---|
| v2 mis-indented line in `aliases/translations.py` | **Fixed** in 21 s; the rules package loads again |
| v2 scheduling (`plan/tasks.py`) | **Fixed**: scheduling mistakes **21,284 → 0**, including 10,143 → 0 in unseen stores |
| v1 label matching (`aliases/detect.py`) | Improved: missed shelves 806 → 0 |
| v2 label matching | **Not fixed**: look-alikes 3 → 0 but missed shelves went up |
| Baseline rules, round 1 | **Not fixed**: over-corrected, 32 new failures |

Two patches took the expansion plan from **21,459 mistakes to 175**. Every attempt, including the failures, is logged in `patches/agent/LOG.jsonl`. I think the failed rows are as important as the wins: an agent that over-corrects is a real failure mode, and hiding it would make the result less useful.

## A working system

The smaller core build (one Argon generation, plus three small logged hand fixes) is what runs the live demo:

- finds **all 467** products containing Red No. 3 across the 20-store drill,
- pulls **none** of the 483 look-alikes,
- produces **zero plan mistakes**,
- and runs end to end with `./demo.sh` in about **5 seconds**.

## Ground rules we kept

- **Argon's output is unedited** in `gen/`. Every fix lives in `patches/`, and patches never count toward Argon's token totals.
- **Real vs simulated is explicit:** rule text and dates, USDA ingredient lists and store locations are real; DCs, shelves, associates, shifts and trucks are seeded simulations.
- **Numbers were frozen** at a git tag mid-afternoon and checked against the reports (18 checks, 0 mismatches) before the submission.
- We also ran a second scenario on 40 real openFDA lot-code recall notices. It **did not pass** our own gate, so we reported it as a failure case instead of demoing it.

## What I'm taking away

1. **Million-token generation is real engineering now.** One stream holding 900+ files together with zero arity mismatches would have sounded like science fiction a year ago.
2. **Verification is the product.** The generation took minutes; the verifier is what made any of it trustworthy.
3. **Hold out what the repair agent can see.** Scoring fixes on unseen stores is the only way we caught over-correction.
4. **Publish your failures.** The NOT_FIXED rows explain the system better than the FIXED ones.

---

**Code:** [github.com/Sudhan30/recall-storm](https://github.com/Sudhan30/recall-storm)
