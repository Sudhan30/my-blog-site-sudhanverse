---
title: "Two Sites, Two Paths: Cloud Portfolio + Self-Hosted Blog"
date: 2024-01-15
tags: [web-development, cloud, homelab, architecture]
excerpt: "Why I built two versions of my blog—one in the cloud, one self-hosted. The lessons, the costs, and what I'd do differently."
slug: my-first-site
---

# Two Sites, Two Paths: Cloud Portfolio + Self‑Hosted Blog

> "The best way to learn infrastructure is to break it yourself." — Me, at 2 AM debugging DNS

Why I built two versions of my web presence—one in the cloud, one self-hosted on bare metal. The lessons, the costs, the 3 AM debugging sessions, and what I'd do differently.

---

## 🤔 Why Two Paths?

I've always been curious: **how does the internet actually work?** Not the textbook version, but the real thing—from buying a domain to seeing your site load in a browser half a world away.

So I built two sites:

| | **Portfolio (Cloud)** | **Blog (Homelab)** |
|---|---|---|
| **Where** | Firebase + GCP | Mini-PC under my desk |
| **Stack** | React, Node.js | Bun.js, TypeScript |
| **Infra** | Managed everything | Kubernetes, bare metal |
| **Cost** | ~$0/month (free tier) | ~$50 one-time hardware |
| **Learning** | CI/CD, CDN, managed DBs | K8s, networking, DNS |

### The Mindset That Drove Me

- **🧠 Build to learn.** System design sticks better when you deploy it yourself, not just read about it.
- **🔧 Own the layers.** From `<div>` to DNS to CDN—ownership unlocks infinite customization.
- **🤖 Use AI ruthlessly.** It makes me 5–10× faster for scaffolding, docs, and first drafts.

---

## 🚀 What I Actually Shipped

### ☁️ Portfolio @ Cloud (sudharsana.dev)

A React SPA hosted on Firebase with some fun features:

```javascript
// Animated hero with confetti on milestone visits
useEffect(() => {
  if (specialMessage) {
    Swal.fire({ title: 'Welcome!', html: specialMessage });
    setShowConfetti(true);
  }
}, [specialMessage]);
```

**Features built:**
- 🎨 Smooth scroll navigation with active section tracking
- 🤖 AI-powered Job Fit Evaluator (yes, it actually works!)
- 📊 OpenTelemetry integration for observability
- 🎉 Confetti celebrations for milestone visitors

### 🖥️ Blog @ Homelab (blog.sudharsana.dev)

A Bun.js server-rendered blog running on Kubernetes:

```yaml
# deployment.yaml - running on my mini-PC!
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: blog
        image: sudhan30/my-blog-site:latest
        ports:
        - containerPort: 3000
```

**The homelab stack:**
- 🐳 Docker + Kubernetes (K3s)
- 🔄 FluxCD for GitOps deployments
- 📊 Prometheus + Grafana for monitoring
- 🔒 Cloudflare for DNS + SSL + CDN

---

## 📅 The 4-Week Journey

### Week 1: "I should build something real"

*The spark:* I realized I'd been reading about infrastructure for years but never actually built anything end-to-end.

**What actually happened:**
- Spent 3 days researching frameworks (analysis paralysis is real)
- Made a spreadsheet comparing Firebase vs. Vercel vs. AWS
- Finally just picked Firebase because it had the nicest docs

> 💡 **Lesson:** Perfect is the enemy of done. Just pick something.

### Week 2: "Let's start with cloud"

*The goal:* Get something live. Fast.

**What I learned:**
- Domain registration is weirdly satisfying
- Firebase deploy is almost too easy (`firebase deploy` and you're live)
- SSL certificates used to be a nightmare—now they're automatic

```bash
# This felt like magic
$ firebase deploy
✓ Deploy complete!
Project Console: https://console.firebase.google.com/project/my-portfolio
Hosting URL: https://sudharsana.dev
```

### Week 3: "What about my homelab?"

*The realization:* Cloud is convenient, but I wasn't learning the fundamentals.

**The pivot:**
- Dusted off my Intel NUC mini-PC
- Installed Ubuntu Server + K3s
- Spent 6 hours figuring out why pods wouldn't start (spoiler: resource limits)

```bash
# The debugging journey
$ kubectl get pods
NAME                    READY   STATUS             RESTARTS   AGE
blog-5d4f9c8b7-x2k9p   0/1     CrashLoopBackOff   5          10m

# Ah, memory limits were too low
$ kubectl describe pod blog-5d4f9c8b7-x2k9p
... OOMKilled ...
```

### Week 4: "This is actually working!"

*The payoff:* Both sites live. Real visitors. Real feedback.

**Milestones:**
- ✅ First visitor from Google search
- ✅ Portfolio milestone celebrations working
- ✅ Blog loading in < 1 second globally (Cloudflare is magic)

---

## 🔧 Technical Deep-Dive

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUD PATH                            │
│  User → Cloudflare CDN → Firebase Hosting → React SPA       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       HOMELAB PATH                           │
│  User → Cloudflare CDN → Tunnel → K8s Ingress → Blog Pod    │
└─────────────────────────────────────────────────────────────┘
```

### DNS + Cloudflare Setup

This was one of the trickiest parts. My DNS records:

| Type | Name | Content | Proxied |
|------|------|---------|---------|
| A | @ | 104.21.x.x | ✓ (Cloudflare) |
| CNAME | blog | tunnel.cfargotunnel.com | ✓ |
| CNAME | www | sudharsana.dev | ✓ |

**The DuckDNS disaster:** I originally used DuckDNS for dynamic DNS, but some VPNs flagged it as suspicious. Moving everything to Cloudflare fixed this completely.

### GitOps with FluxCD

Every change to my blog goes through Git:

```bash
# Push code → GitHub Actions builds image → FluxCD syncs to cluster
git push origin main

# FluxCD detects the new image automatically
$ flux get kustomizations
NAME    READY   STATUS
blog    True    Applied revision: main@sha1:abc123
```

---

## 💥 Things That Broke (And How I Fixed Them)

### 1. The Mysterious 502 Errors

**Symptom:** Random 502s during traffic spikes.

**Root cause:** Ingress timeout was too low for Bun.js cold starts.

**Fix:**
```yaml
# ingress.yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
  nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
```

### 2. CSS Caching Nightmare

**Symptom:** Deployed new styles, but users saw old CSS.

**Root cause:** Browser caching + Cloudflare caching = stale assets.

**Fix:** Cache-busting with version query strings:
```html
<link rel="stylesheet" href="/styles/main.css?v=2025010101">
```

### 3. Kubernetes Pod Evictions

**Symptom:** Pods randomly dying on my mini-PC.

**Root cause:** Memory limits too aggressive + system processes fighting for RAM.

**Fix:** Set realistic limits and added a swap file:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 💡 Key Lessons

### For Cloud Deployments
1. **Start with managed services** - They handle the boring stuff
2. **Use a CDN from day one** - Performance is free
3. **Automate everything** - `firebase deploy` beats manual uploads every time

### For Self-Hosting
1. **Learn Kubernetes basics** - Pods, Services, Ingress are your vocabulary
2. **GitOps is worth it** - Even for a personal blog
3. **Monitoring is not optional** - You can't fix what you can't see

### For Both
1. **Own your domain** - It's your identity on the internet
2. **Iterate fast** - Ship something ugly, then make it pretty
3. **Document as you go** - Your future self will thank you

---

## 🔮 What's Next?

- [ ] **Architecture deep-dive post** - The full Kubernetes + FluxCD setup
- [ ] **AI integrations** - Chatbot for site navigation?
- [ ] **Edge deployments** - Experiment with Cloudflare Workers
- [ ] **Weekly newsletter** - Consistent content cadence

---

## 🎯 Final Thought

> "Not using AI now is like skipping the internet during the dot-com boom. Learn it. Use it. Ship faster."

The internet is made of layers: code, servers, networks, and DNS. Understanding those layers—really understanding them—makes you a better engineer. Whether you go cloud-first or homelab-first, the key is to **build something real**.

---

*Built with ❤️ and curiosity. Architecture deep-dive coming soon.*

**Have questions? Drop a comment below or find me on [GitHub](https://github.com/sudharsanarajasekaran) and [LinkedIn](https://www.linkedin.com/in/sudharsanarajasekaran/).**
