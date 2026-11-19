---
title: "BabbleScribe: Private Voice Typing for Android"
date: 2026-10-30
category: engineering
tags: [android, speech-to-text, privacy, llm, self-hosted]
excerpt: "I talk faster than I type, and I did not want every sentence going to someone else's server. So I built BabbleScribe: private voice typing for Android that runs on your phone, on your own server, or on a cloud key you bring, with your history encrypted on the device. It is heading to Google Play."
slug: babblescribe-private-voice-typing
readTime: 7
featured: true
cover: /assets/images/babblescribe/screens.png
badge: "Coming soon to Google Play"
event: "Android 11+ · ARM64"
highlights:
  - "Execution Modes: On-device (~100 MB Whisper/Parakeet/Moonshine), self-hosted GPU, or BYO API key"
  - "Enforced Privacy: Android Keystore keys, encrypted-at-rest history, DNS check on local-only mode"
  - "Faithful Polishing: 62/63 spoken corrections applied · 51/51 look-alike negations preserved"
---

I talk much faster than I type. On a phone the gap is worse, and it is worse again when I switch languages halfway through a sentence. The dictation built into most keyboards either sends every word to a server I do not control, or falls apart at the switch.

So I built my own. **BabbleScribe** is private voice typing for Android. You speak, it writes, and you decide where your voice goes. It has no account, no ads and no analytics. If you read the first version of this post, the app was called BabbleFlow back then. Same app, new name, and it is now heading to Google Play.

![BabbleScribe: Home, first run, History and the dark theme](/assets/images/babblescribe/screens.png)

*Screenshots are rendered from the app with made up notes.*

## Three ways to be heard

The first screen asks one question: how should BabbleScribe hear you? Every answer is a real architectural choice about where your audio travels.

| Mode | Audio Destination | Requirements | Fallback Role |
|---|---|---|---|
| **On my phone** | Never leaves device | One-time ~100 MB model download (Whisper, Parakeet, or Moonshine) | Offline-safe default; no key or account |
| **My cloud key** | Direct to your chosen provider (OpenAI, Groq, OpenRouter, ElevenLabs, or OpenAI-compatible API) | Bring your own API key; zero middleman relay | High-accuracy cloud fallback |
| **My own server** | Your self-hosted GPU box (paired via setup code) | Home/private server (e.g., Whisper large-v3 + language-tuned model + small Gemma cleanup) | Primary low-cost, private high-accuracy tier |

You do not have to pick only one. The **Speech flow** chains providers in an order you choose — for example, home server first, then Groq, then on-device. If a step cannot take a dictation (offline, out of credits, rate-limited, or server busy), BabbleScribe automatically fails over to the next provider and displays in one short line which tier handled it.

## Dictate anywhere

Recording inside the app is the easy part. The useful part is getting words into whatever you are typing in.

- **A voice keyboard.** A keyboard with a microphone and almost nothing else. Switch to it from HeliBoard, FUTO Keyboard or any keyboard with a mic key, talk, and the text lands in the field. It never records in password fields, never touches the clipboard, and treats incognito fields as private.
- **A floating mic.** An optional pill that floats over other apps and types into the field you are in. It uses Android's Accessibility service, so it is off until you turn it on, and the privacy policy spells out what it reads and what it never reads.

![The floating mic: recording, transcribing, polishing, done, and what it says when something fails](/assets/images/babblescribe/pill.png)

## Private by default, not by promise

Privacy claims are cheap. These are the ones the code enforces.

- **Your history stays on the phone, encrypted.** Transcripts and the original audio are encrypted at rest. History is hidden from screenshots and screen recording.
- **Your keys stay in the Android Keystore.** They are never exported in backups or shares.
- **"Phone and my server only" is a real switch.** While it is on, audio never goes to a cloud provider. A server that only *claims* to be on your network (a `.local`, `.lan` or Tailscale name) is checked at connect time: if the name resolves to a public address, nothing is sent.
- **Private takes stay private.** A private session skips History and Insights, and never sends text to a cloud model for polishing.
- **A new address needs a new yes.** A provider only joins your flow after you tap "Add to flow" on a sheet that says where your audio will go. Change its address later and its steps pause until you agree again.
- **Backups are yours.** Encrypted backup and restore to any folder you pick, with a recovery key only you hold.

## Polishing, and the "20 minutes, no, 10 minutes" bug

Raw transcripts read like raw speech: no punctuation, a few "um"s, the odd false start. BabbleScribe can optionally pass the transcript through a text model you choose for a light cleanup. It is a *faithful* cleanup, not a rewrite: it adds punctuation and paragraphs, drops fillers, and keeps your wording. Every answer is checked before you see it. If the model invents a number, adds an AM or PM you never said, loses a "not", or drifts too far from what you said, the app throws the result away and keeps your original words.

This week I dictated:

> "Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."

I expected *"Hey, can we schedule a meeting in 10 minutes?"* I got both numbers back, neatly punctuated.

> [!IMPORTANT]
> **Root Cause — Two Bugs Masking Each Other:**
> 1. **Contradictory prompt rules:** One clause asked the model to apply spoken corrections, while three stronger clauses forbade removing words or altering numbers. Careful models like Claude Haiku chose the conservative reading and kept both numbers.
> 2. **Over-eager post-check:** The negation safety guard only recognized `"no"` as a correction at the start of a sentence. When `"the meeting is with Sarah, no no, with Priya"` was correctly cleaned to `"the meeting is with Priya"`, the verifier flagged it as a dropped negation and reverted to raw text.

I built a small regression suite before touching anything: 21 dictations where a correction should be applied (numbers, names, days, units, and Tamil examples using "இல்ல", roughly "no"), plus 17 look-alikes that must survive untouched (such as *"not 20 but 10 people came"* and *"sorry I'm late, I'll be there in 10"*).

| Configuration | Corrections applied | Look-alikes preserved |
|---|---|---|
| Old instructions + old guard | 11 of 21 | 17 of 17 |
| New instructions + new guard (3 runs each) | **62 of 63** | **51 of 51** |

The fix was boring in the best way: state the correction rule plainly with examples, say that "preserve numbers" means *never invent or change one*, not *keep the one you took back*, and teach the check to recognise a correction "no" by its shape. The check still rejects "there is no problem" turning into "there is a problem," and it got stricter elsewhere: a stray "actually" no longer excuses a dropped "not."

## What is in the app

- On phone models for offline dictation in many languages
- Bring your own speech service: OpenAI, Groq, OpenRouter, ElevenLabs speech to text, any compatible API, or your own server
- One connection, many models: the same OpenRouter key can run Whisper for speech and a different model for polishing
- Optional faithful cleanup with a provider you choose, off by default
- Encrypted History with search, pins, edits, export and private sessions
- Insights computed on the phone: words per week, streaks, speaking pace, most used words in each language
- Encrypted backup and restore with a recovery key

## Coming soon

BabbleScribe is heading to Google Play, starting with a closed test. I will post here when it opens up.

If you would like to help test it before launch, get in touch with me on [LinkedIn](https://www.linkedin.com/in/sudharsanarajasekaran/).

## What is next

- **Seeing both versions of a note.** Open any note and compare the original text with the polished text.
- **Transcribing a saved recording again** with another model, and keeping each version side by side.
- **Suggested titles** for longer notes.
- **A usage page** that shows each provider's calls, time and cost, so you can see where your voice went and what it cost.

Once you can try it, I would love to hear what you dictate with it, and what it gets wrong.

*BabbleScribe is not affiliated with ElevenLabs, OpenAI, OpenRouter, Groq, Anthropic or Google.*
