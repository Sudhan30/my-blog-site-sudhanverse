---
title: "HealthForce: One Cortex Agent for the Whole ER Team (Anthropic × Snowflake Hackathon Winner)"
date: 2026-10-23
tags: [hackathon, snowflake, ai-agents, claude, healthcare, data-governance]
excerpt: "We won the Anthropic × Snowflake Intelligence at Work Hackathon with HealthForce: one Snowflake Cortex Agent that serves the paramedic, the ER doctor and the nurse on the same patient, identifies an unconscious patient from 1.42M synthetic records, and turns 'hang blood' into an exact, type-specific order."
slug: healthforce-snowflake-anthropic-hackathon
readTime: 9
cover: /assets/images/hackathons/healthforce-cover.jpg
featured: true
badge: "Winner"
event: "Anthropic × Snowflake Intelligence at Work Hackathon"
---

> "He's here. Pull off the gauze and hang blood."
>
> Nobody said the blood group. The agent found it anyway.

I ended the week with a win. Our team built **HealthForce** at the [Anthropic × Snowflake Intelligence at Work Hackathon](https://cerebralvalley.ai/e/intelligence-at-work-hackathon), and it took first place. This post is the build story: the problem, the architecture on Snowflake, the privacy design, and what broke along the way.

**All patient data in this project is synthetic** (Synthea, from the Snowflake Marketplace). No real PII or PHI was used anywhere.

---

## The problem: the patient arrives before their records do

An emergency room is a team sport played against a clock. A paramedic, a doctor and a nurse all need the same facts within minutes, and the patient's condition changes by the second.

The facts are rarely in one place:

- A patient's history is spread across hospitals, clinics and partner systems.
- Unconscious or unidentified patients ("John Doe") are the hardest case: the team works blind on allergies, medications and history.
- Sharing healthcare data is slow and careful for good reasons (HIPAA). Moving fast and staying private pull against each other.

The result is friction: phone calls to other hospitals, partner portal logins, repeated questions, repeated tests, and details lost at handover.

## What we built

![HealthForce team view: paramedic, doctor and nurse phones driven by one Cortex Agent](/assets/images/hackathons/healthforce-cover.jpg)

### One agent, three people, three phones

HealthForce is **one Snowflake Cortex Agent** shared by the whole care team, shown as three phones side by side: **Paramedic** (blue), **Doctor** (coral) and **Nurse** (teal).

Every message is tagged with who sent it, and the agent answers in that person's register:

| Role | What the agent gives them |
|---|---|
| Paramedic | Two field-actionable lines, nothing more |
| Doctor | Clinical detail, risks, what to sequence first |
| Nurse | A ready list: what to prepare, drug safety, access |

The agent also routes work between people: critical handoffs go to the doctor, tasks land on the nurse's ready list, and status flows back.

### Identifying an unknown patient

The paramedic describes what they see: rough age, height, city, medicines in a pocket, a hospital slip. The agent narrows **1.42 million** synthetic patients step by step (for example 361,520 in Cleveland down to 13 people), then asks for **one bedside check**: *"appendectomy scar or insulin injection sites?"*

One tap later it names the **most likely** person, always phrased as "most likely", with a reminder to confirm identity. The team confirms; the agent supports.

### A briefing from every care site

Once there is a likely match, the agent assembles the chart from every care site that holds records and flags what matters in the next ten minutes:

- clopidogrel on top of the aspirin given in the field (bleeding risk)
- a beta blocker masking how severe the shock is
- amlodipine compounding low blood pressure
- prior imaging at another hospital, so tests don't need repeating

### Live vitals and alerts nobody had to ask for

A simulated ambulance monitor streams BP, heart rate, SpO2 and respiratory rate on the paramedic's phone. When blood pressure falls (89/51 → 80/44) or oxygen drops to 92%, **the monitor alerts the team on its own**. The doctor gets a critical alert, the nurse's ready list fills, and the paramedic gets one action to take now.

### The signature moment: orders without the details

The doctor says only *"He's here. Pull off the gauze and hang blood."*

On the nurse's phone, the gauze item is struck off ("Removed by Dr. Okafor") and **"2 units packed red cells, A-positive, type-specific, warmed"** appears, along with where the blood type came from (a prior type and screen at another health system) and a new task to send a fresh type and screen.

The guardrails matter more than the trick:

- A type on file is **history, not a crossmatch**, so it always orders a fresh type and screen.
- It names O-negative as the stopgap if the patient crashes first.
- It never claims blood is released, and never guesses a group that isn't on file.

## Architecture on Snowflake

```
Browser (Next.js) ──► /api/agent ──SSE──► Cortex Agent  HEALTHLINE.GOLD.ER_ASSISTANT
                     (key-pair JWT)       ├─ identify_patient    funnel + ranked candidates + bedside checks
                                          ├─ get_patient_chart   alerts, vitals, meds, care sites
                                          ├─ ask_data            Cortex Analyst on a semantic view
                                          └─ data_to_chart       Vega-Lite charts
```

1. **Source:** Synthea clinical and claims data from the Snowflake Marketplace: 1.42M patients, 64M visits, 763M observations across 12 metro areas.
2. **Data Vault:** a dbt project running inside Snowflake (AutomateDV) with hubs, links, satellites and a business vault.
3. **Gold layer:** one wide row per patient (demographics, latest vitals, active meds and conditions, allergies, identifying marks, visit history), plus a live ER board and an access log.
4. **Agent tools:** Snowpark Python stored procedures to identify a patient, build the chart, write the ER brief, confirm identity, search history and break glass.
5. **Cortex Analyst** over a semantic view for population and history questions.
6. **Cortex Agent** orchestrating the tools, with **Claude** as the orchestration model.
7. **App:** Next.js streaming the Agent REST API over server-sent events, with SQL through the Snowflake SQL API as a key-pair service user, so credentials never reach the browser.

The Marketplace data has no blood types, so we generated one per patient from real US frequencies (O+ 37%, A+ 36%, ...), fixed per patient and clearly labelled synthetic.

## Privacy by design, not bolted on

This is the part I'm proudest of. The pitch is *everyone sees what they need, and nothing more*, and the data layer enforces it:

- **Tag-based masking:** columns tagged PII/PHI are masked by policy (text masked, dates generalised to the year, ZIP and coordinates hidden).
- **Least privilege:** the app's role sees only the curated gold layer, never raw tables or the vault. Agent tools run with owner's rights.
- **Break-glass access:** sensitive records (mental health, substance use) are hidden by default. A clinician can unlock them in an emergency, and every access is logged with name and reason.
- **Data clean room:** partner data (for example a payer's member list) is matched on salted, hashed keys and shared only as **aggregates of at least 25 people**, using aggregation and projection policies.

## My part

I built the **team view** (three role-based phones from one agent), the **live ambulance vitals and unprompted alerts**, **implicit orders with automatic blood group**, the synthetic blood-type data, the demo recording and voiceover, and the submission.

I used **Claude Code** to build and test the web app end to end. It drove a real browser against the live agent through every step and caught real problems along the way. The demo itself was recorded automatically with Playwright from the live agent and narrated with an open-source voice model running locally.

## What didn't work (the honest part)

- **MFA blocked programmatic login** on the hackathon account, and key-pair login needed extra privileges, so we switched to OAuth mid-build.
- A tool was **redeployed with a new signature before the agent was**, and patient identification silently failed until the agent caught up.
- The vault's staging views **sampled each table independently** (`LIMIT 100000` each), so most sampled patients had no linked meds or visits. The gold layer reads the clean source tables instead.
- The agent once reported a task as "ready" that **nobody had confirmed**, and once turned "pull the gauze" into a *new* task instead of removing the old one. Explicit rules and a structured remove operation fixed both.

## What I learned

- **One well-instructed agent can serve several roles** convincingly from one shared conversation, if every message carries who sent it.
- **Governance belongs in the data layer from day one.** Masking, least privilege and clean rooms were cheaper to design in than they would have been to retrofit.
- New Snowflake surfaces for me: Cortex Agents, Cortex Analyst semantic views, clean rooms with aggregation and projection policies, tag-based masking, and Cortex Code.
- With AI coding agents, an idea really can become a working, tested product in a day. The bottleneck moves to deciding what is *safe* to ship.

## What's next

Real FHIR and HIE feeds (starting de-identified), real lab results for blood type, a clinical safety review, a shadow-mode pilot in one emergency department, and packaging as a Snowflake Native App.

---

Built with Amadeus Colenbrander, who laid the Snowflake foundation (Data Vault, gold layer, agent tools, semantic view and the Cortex Agent), and Aswin Subramanian.

**Code:** [github.com/Amadeus415/healthline](https://github.com/Amadeus415/healthline)
