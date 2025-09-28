---
title: From Idea to Live: How I Built My Site(s) and What I Learned
date: 2024-01-15
tags: [web-development, cloud, homelab, portfolio, blog]
excerpt: A no‑fluff story about building my portfolio in the cloud and a self‑hosted blog in my homelab—what worked, what didn't, costs, and what I'd do next.
slug: my-first-site
---

# From Idea to Live: How I Built My Site(s) and What I Learned

This is the story—not the architecture—of how I took a learning project and shipped it live twice: once in the cloud (portfolio) and once in my homelab (blog). What I felt, what broke, what I fixed, how little it costs, and what you can reuse.

## Why Two Paths?

I wanted the real thing—and two perspectives: the convenience of managed cloud and the control of on‑prem. So I launched my **portfolio** in the cloud and my **blog** in my homelab.

**Portfolio**: ~2 hours domain → prod (AI + defaults = speed)  
**Blog**: ≈ $2/mo amortized (Multi‑service homelab)

## Stack at a Glance

- ☁️ GCP hosting, CDN/SSL
- 🖥️ Linux + K3s/Kubernetes
- 🌐 Cloudflare for DNS & Edge
- 📧 Zoho Mail newsletters
- 🔍 SEO + performance tweaks

## New Challenges & Hidden Wins

- **SEO experiments:** Learning how meta tags, clean URLs, and structured data help search discoverability.
- **Security mindset:** Coming from Walmart, I realized preventing bad actors is as important as building features. Rate limits, WAF rules, and bot filters became must‑dos.
- **McAfee/VPN hurdles:** Some VPNs blocked my dynamic DNS; migrating to Cloudflare solved it.
- **Newsletter funnel:** Owning my own newsletter pipeline gives me freedom beyond Medium or Substack.

## Community & Collaboration

One of the unexpected joys: friends and colleagues actually started visiting my blog, giving feedback, and even filing small PRs on GitHub. It stopped being a "solo experiment" and turned into a shared sandbox.

> "Build in public, even if it's rough—it creates conversations you can't predict."

## Future Horizons

- 📰 Weekly blog + newsletter cadence.
- 📚 Publish deep‑dives into **architecture design**.
- 🤖 Expand AI integrations—chatbots, automated analytics dashboards.
- ⚙️ Experiment with edge deployments (Cloudflare Workers, Fly.io).
- 📈 Grow blog into a data‑first playground—real metrics, dashboards, A/B testing.

## Final Thought

> "Not using AI now is like skipping the internet during the dot‑com boom. Learn it. Use it. Ship faster."

[Visit my portfolio](https://sudharsana.dev) | [Subscribe to the newsletter](#newsletter)

## Get the next post

I write about practical building: cloud speed, homelab reality, AI workflows, and checklists you can reuse.

*No spam. Unsubscribe any time.*

---

Built with ❤️, caffeine, and curiosity. Architecture deep‑dive coming soon.
