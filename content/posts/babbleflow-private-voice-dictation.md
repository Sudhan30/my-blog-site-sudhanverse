---
title: "BabbleFlow: Private Voice Dictation for Android, in English and Tamil"
date: 2026-10-30
category: open-source
tags: [android, speech-to-text, privacy, open-source, llm, self-hosted]
excerpt: "I talk faster than I type, in two languages, and I did not want every sentence going to someone else's server. So I built BabbleFlow: an open source Android dictation app that runs on your phone, on your own server, or on a cloud key you bring, with your history encrypted on the device."
slug: babbleflow-private-voice-dictation
readTime: 8
featured: true
cover: /assets/images/babbleflow/screens.png
badge: "Open Source · v0.15.0"
event: "Apache 2.0 · Android 11+ ARM64"
repoUrl: "https://github.com/Sudhan30/babbleflow"
releaseUrl: "https://github.com/Sudhan30/babbleflow/releases/latest"
version: "v0.15.0"
license: "Apache-2.0"
highlights:
  - "English & Tamil Dictation"
  - "On-Phone / BYO Key / Self-Hosted"
  - "62/63 Self-Correction Accuracy"
---

I talk much faster than I type. On a phone the gap is worse, and it is worse again when half of what I say is in Tamil. The dictation built into most keyboards either sends every word to a server I do not control, or falls apart the moment I switch languages mid sentence.

So I built my own. **BabbleFlow** is a voice dictation app for Android. You speak, it writes, and you decide where your voice goes. It is open source under Apache 2.0, it has no account, no ads and no analytics, and you can [download it from GitHub](https://github.com/Sudhan30/babbleflow/releases/latest) today.

![BabbleFlow: Home, first run, History and the dark theme](/assets/images/babbleflow/screens.png)

*Screenshots are rendered from the app with made up notes.*

---

## Three ways to be heard

The first screen asks one question: how should BabbleFlow hear you? Every answer is a real choice about where your audio goes.

- **On my phone.** Download a speech model once (Whisper, Parakeet or Moonshine, around 100 MB) and dictate offline. No key, no account, nothing leaves the phone.
- **My cloud key.** Bring your own key for OpenAI, Groq, OpenRouter, ElevenLabs or any OpenAI compatible service. Your audio goes to that company and nobody else. I never see it, because there is no BabbleFlow server in the middle.
- **My own server.** Pair a GPU box you run yourself with a setup code. Mine sits at home and runs Whisper large v3, a Tamil tuned speech model, and a small Gemma model for cleanup.

You do not have to pick only one. The **Speech flow** puts providers in an order you choose, for example my server first, then Groq, then the phone. If a step cannot take a dictation (offline, out of credits, rate limited, server busy), BabbleFlow quietly moves to the next one and tells you in one short line which provider handled it.

## Dictate anywhere

Recording inside the app is the easy part. The useful part is getting words into whatever you are typing in.

- **A voice keyboard.** A keyboard with a microphone and almost nothing else. Switch to it from HeliBoard, FUTO Keyboard or any keyboard with a mic key, talk, and the text lands in the field. It never records in password fields, never touches the clipboard, and treats incognito fields as private.
- **A floating mic.** An optional pill that floats over other apps and types into the field you are in. It uses Android's Accessibility service, so it is off until you turn it on, and the privacy policy spells out what it reads and what it never reads.

![The floating mic: recording, transcribing, polishing, done, and what it says when something fails](/assets/images/babbleflow/pill.png)

## Private by default, not by promise

Privacy claims are cheap. These are the ones the code enforces.

- **Your history stays on the phone, encrypted.** Transcripts and the original audio are encrypted at rest. History is hidden from screenshots and screen recording.
- **Your keys stay in the Android Keystore.** They are never exported in backups or shares.
- **"Phone and my server only" is a real switch.** While it is on, audio never goes to a cloud provider. A server that only *claims* to be on your network (a `.local`, `.lan` or Tailscale name) is checked at connect time: if the name resolves to a public address, nothing is sent.
- **Private takes stay private.** A private session skips History and Insights, and never sends text to a cloud model for polishing.
- **A new address needs a new yes.** A provider only joins your flow after you tap "Add to flow" on a sheet that says where your audio will go. Change its address later and its steps pause until you agree again.
- **Backups are yours.** Encrypted backup and restore to any folder you pick, with a recovery key only you hold.

## Polishing, and the "20 minutes, no, 10 minutes" bug

Raw transcripts read like raw speech: no punctuation, a few "um"s, the odd false start. BabbleFlow can optionally pass the transcript through a text model you choose for a light cleanup. It is a *faithful* cleanup, not a rewrite: it adds punctuation and paragraphs, drops fillers, and keeps your wording. Every answer is checked before you see it. If the model invents a number, adds an AM or PM you never said, loses a "not", or drifts too far from what you said, the app throws the result away and keeps your original words.

This week I dictated:

> "Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."

I expected *"Hey, can we schedule a meeting in 10 minutes?"* I got both numbers back, neatly punctuated.

Two things were wrong, and only one of them was the model.

1. **The instructions argued with themselves.** One clause said to apply spoken corrections. Three louder ones said to never remove words, to preserve every number, and that "a meeting at seven stays a meeting at seven." A careful model like Claude Haiku took the safe reading and kept everything.
2. **The safety check threw away correct answers.** The check that stops a model from dropping a "not" only treated "no" as a correction when it started a sentence. So "the meeting is with Sarah, no no, with Priya" cleaned to "the meeting is with Priya" was rejected as a lost negation, and the raw text came back.

I built a small test set before touching anything: 21 dictations where a correction should be applied (numbers, names, days, units, and a few in Tamil with "இல்ல"), and 17 look alikes that must survive untouched, like "not 20 but 10 people came" and "sorry I'm late, I'll be there in 10."

| | Corrections applied | Look alikes left alone |
|---|---|---|
| Old instructions, old check | 11 of 21 | 17 of 17 |
| New instructions, new check (3 runs each) | 62 of 63 | 51 of 51 |

The fix was boring in the best way: state the correction rule plainly with examples, say that "preserve numbers" means *never invent or change one*, not *keep the one you took back*, and teach the check to recognise a correction "no" by its shape. The check still rejects "there is no problem" turning into "there is a problem," and it got stricter elsewhere: a stray "actually" no longer excuses a dropped "not."

## What is in the app

- On phone models for offline dictation in English and Tamil
- Bring your own speech service: OpenAI, Groq, OpenRouter, ElevenLabs, any compatible API, or your own server
- One connection, many models: the same OpenRouter key can run Whisper for speech and a different model for polishing
- Optional faithful cleanup with a provider you choose, off by default
- Encrypted History with search, pins, edits, export and private sessions
- Insights computed on the phone: words per week, streaks, speaking pace, most used words in each language
- Encrypted backup and restore with a recovery key

## Try it

1. Download the APK from the [latest release](https://github.com/Sudhan30/babbleflow/releases/latest). You need Android 11 or newer on an ARM64 phone. The release page lists the SHA-256 checksum if you want to verify the file.
2. Install it. Android will ask you to allow installs from your browser or file manager, since it is not from the Play Store.
3. Pick **On my phone** for the zero setup path, download a model, and hold the mic to talk.

The code is on [GitHub](https://github.com/Sudhan30/babbleflow). Issues, ideas and pull requests are welcome, and Tamil speakers especially: tell me where it gets you wrong.

## What is next

- **Polishing that falls back** the way speech already does, so a busy or broken cleanup model hands off to the next one instead of giving up.
- **Read back in your own voice**, with stock voices and an optional clone of your own voice through ElevenLabs, behind an explicit spoken consent.

If you try it, I would love to hear what you dictate with it, and what it gets wrong.
