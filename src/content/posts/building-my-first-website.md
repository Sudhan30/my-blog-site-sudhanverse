---
title: "Two Sites, Two Paths: Cloud Portfolio + Self-Hosted Blog"
date: 2024-01-15
tags: [web-development, cloud, homelab, architecture]
excerpt: "Why I built two versions of my blog—one in the cloud, one self-hosted. The lessons, the costs, and what I'd do differently."
slug: my-first-site
---

# Two Sites, Two Paths: Cloud Portfolio + Self‑Hosted Blog

Why I built two versions of my blog—one in the cloud, one self-hosted. The lessons, the costs, and what I'd do differently.

## Why Two Paths?

I wanted to experience both managed and self-hosted approaches. The cloud version teaches me about managed services, while the homelab version gives me complete control and deeper system understanding.

### The Mindset
- **🧠 Build to learn.** System design sticks better when you deploy it, not just read about it.
- **🔧 Own the layers.** From HTML div to DNS to CDN—ownership unlocks infinite customization.
- **🤖 Use AI, ruthlessly.** It makes me 5–10× faster for scaffolding, docs, and first drafts.

### What I Shipped (High‑level)
- **☁️ Portfolio @ Cloud:** domain → SSL → hosting → CI in a sitting. Free‑tier friendly.
- **🖥️ Blog @ Homelab:** self‑hosted on my mini‑PC; Kubernetes for repeatable deploys.
- **📊 Analytics:** lightweight, privacy‑aware signals to improve UX (no creepy tracking).
- **🛡️ Hardening:** Cloudflare, DNS hygiene, sane bot rules, and reputation clean‑up.

## The Journey

### Week 1: "I should build something real"
The initial spark and overwhelming choice paralysis

### Week 2: "Let's just start with the cloud"
GCP setup, domain purchase, first deployment

### Week 3: "Wait, what about my homelab?"
The realization that two paths could teach different lessons

### Week 4: "This is actually working"
First real visitors, feedback, and the confidence boost

## Technical Challenges & Solutions

- **🔧 Infrastructure as Code:** Learned Kubernetes manifests, Helm charts, and GitOps workflows the hard way.
- **🌐 DNS Mastery:** From basic A records to CNAME chains, SPF/DKIM setup, and subdomain routing.
- **🔒 Security Hardening:** Rate limiting, WAF rules, bot detection, and SSL certificate automation.
- **📈 Performance Optimization:** CDN configuration, image optimization, and caching strategies.
- **🔄 CI/CD Pipeline:** Automated builds, testing, and deployments across multiple environments.
- **Dynamic DNS issues:** Some VPNs blocked DuckDNS; migrating to Cloudflare solved it completely.
- **SEO optimization:** Added meta tags, structured data, and clean URLs for better discoverability.
- **Security mindset:** Coming from Walmart, I realized preventing bad actors is as important as building features. Rate limits, WAF rules, and bot filters became must‑dos.
- **Newsletter funnel:** Owning my own newsletter pipeline gives me freedom beyond Medium or Substack.

## Things That Broke (and How I Fixed Them)

- **🌐 Dynamic DNS Issues:** Got flagged by VPNs. Solution: Moved records and TLS to Cloudflare; reputation + caches improved reachability.
- **🤖 Bot noise & crawlers:** Solution: Basic WAF rules, rate limiting, and a stricter robots policy for non‑content paths.
- **🧠 Complex routing brain‑twisters:** Solution: Drew the traffic flow (client → CDN → ingress → service) and validated each hop with logs.

## Lessons You Can Steal

- **💎 Pick Two Constraints:** Money & learning - let them drive your stack.
- **🔐 Own Your DNS/SSL/CDN:** Early—it's where reliability and speed are won.
- **⚙️ Automate Deploys:** Even for a personal site; it keeps you fearless.
- **📊 Measure, Don't Track:** Favor UX metrics over invasive analytics.
- **📝 Write the Playbook:** As you go. Your future self will reuse it in minutes.

## What I'd Tell My Past Self

- **⚡ Stop Overthinking:** Pick something and ship. You'll learn more from shipping than from researching.
- **🛤️ Two Paths Isn't Overkill:** It's smart. You need to experience both managed and self-hosted to make informed decisions.
- **📢 Share Early, Share Often:** The feedback loop from real users beats any tutorial or course.
- **🤖 AI Isn't Cheating:** It's accelerating. Use every tool available to move faster and learn more.
- **📚 Document Everything:** Your future self will thank you when you're debugging at 2 AM.

## What I'd Do Differently

### Retrospective
- Define an error‑budget early; alerts only when user experience is at risk.
- Lock in access‑log schemas for faster analytics iteration.
- Write a tiny "new‑service" generator to scaffold DNS, certs, and ingress in one go.

### What's Next
- Publish the architecture deep‑dive as a separate post.
- Harden CI for blue/green previews and smoke tests.
- Ship a weekly newsletter and lightweight release notes.

## Future Horizons

- **📰 Weekly Blog + Newsletter:** Consistent cadence for regular content delivery.
- **📚 Architecture Deep‑dives:** Publish detailed technical architecture content.
- **🤖 AI Integrations:** Chatbots, automated analytics dashboards.
- **⚙️ Edge Deployments:** Experiment with Cloudflare Workers, Fly.io.
- **📈 Data‑First Playground:** Real metrics, dashboards, A/B testing.

## Final Thought

"Not using AI now is like skipping the internet during the dot‑com boom. Learn it. Use it. Ship faster."

Built with ❤️ and curiosity. Architecture deep‑dive coming soon.
