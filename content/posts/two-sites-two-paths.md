---
title: "Two Sites, Two Paths: Cloud Portfolio + Self-Hosted Blog"
date: 2026-02-08
tags: [infrastructure, deployment, cloud, self-hosting, devops, kubernetes]
excerpt: "Firebase for a serverless portfolio versus a self-hosted Kubernetes cluster for a full-featured blog. Why I chose different deployment strategies for different needs, and what I learned from each."
slug: two-sites-two-paths
---

> "The best infrastructure is the one that matches your constraints."

I run two production websites with fundamentally different infrastructure strategies:
- **Portfolio** ([sudharsana.dev](https://sudharsana.dev)): Firebase Hosting, serverless, $0/month
- **Blog** ([blog.sudharsana.dev](https://blog.sudharsana.dev)): Self-hosted Kubernetes on a mini PC, full control

This isn't about which approach is "better"—it's about **matching technology to requirements**. Here's why each site uses the architecture it does, and what I learned from running both.

---

## Tale of Two Sites

### Portfolio: Serverless Firebase

**What It Is:**
- Static React SPA with serverless backend
- Contact forms, analytics, AI job analyzer
- Global CDN distribution

**Why Firebase:**
- **Cost:** Free tier covers all traffic ($0/month)
- **Simplicity:** Zero infrastructure management
- **Performance:** Global CDN with edge caching
- **Reliability:** 99.99% uptime SLA from Google

**Architecture:**
```
Firebase Hosting (CDN)
     │
     ├──> Static Assets (HTML/CSS/JS)
     └──> Cloud Functions (API endpoints)
           │
           ├──> Firestore (database)
           ├──> Secret Manager (credentials)
           └──> Pub/Sub + BigQuery (analytics)
```

**Perfect For:**
- Static/JAMstack sites
- Low-to-moderate traffic
- Simple backend logic
- Budget-conscious projects

---

### Blog: Self-Hosted Kubernetes

**What It Is:**
- Server-side rendered blog with Bun.js
- Comments, likes, AI summarization
- Full-text search, RSS feed
- Dagster orchestration for background jobs

**Why Self-Hosted:**
- **Control:** Full access to infrastructure
- **Cost:** Hardware sunk cost, no monthly fees
- **Learning:** Hands-on Kubernetes experience
- **Capabilities:** Complex workloads (GPU inference, ML training)

**Architecture:**
```
Mini PC (AMD UM790 - 64GB RAM, Radeon 780M GPU)
     │
     └──> K3s (Lightweight Kubernetes)
           │
           ├──> Blog (Bun.js SSR)
           ├──> PostgreSQL (blog database)
           ├──> Ollama (Gemma 3 12B - GPU accelerated)
           ├──> Dagster (orchestration)
           └──> Gotify (push notifications)
```

**Perfect For:**
- Complex applications
- GPU/ML workloads
- Learning K8s/DevOps
- Projects outgrowing serverless limits

---

## Architecture Comparison

| Aspect | Portfolio (Firebase) | Blog (Self-Hosted K8s) |
|--------|---------------------|------------------------|
| **Hosting** | Firebase Hosting CDN | K3s on mini PC |
| **Backend** | Cloud Functions (serverless) | Bun.js (SSR) |
| **Database** | Firestore (NoSQL) | PostgreSQL (SQL) |
| **Cost** | $0/month | ~$5/month (electricity) |
| **Uptime** | 99.99% (Google SLA) | 99.5% (self-managed) |
| **Scalability** | Auto-scales to millions | Limited to hardware |
| **Control** | Abstracted away | Full control |
| **Maintenance** | Zero | Weekly updates/patches |
| **Learning** | Serverless patterns | K8s, networking, GPU |

---

## When to Choose Serverless (Firebase)

### ✅ Good Fit

1. **Static Sites or JAMstack Apps**
   - Portfolio sites, landing pages
   - Documentation sites
   - Marketing websites

2. **Predictable Traffic Patterns**
   - Low-to-moderate traffic
   - Traffic fits within free tier limits
   - No sudden traffic spikes

3. **Simple Backend Logic**
   - CRUD operations
   - Form handling
   - API integrations

4. **Budget Constraints**
   - Free tier covers most small projects
   - Pay-as-you-go pricing
   - No infrastructure costs

### ❌ Poor Fit

1. **Long-Running Processes**
   - Cloud Functions timeout at 60 seconds (1st gen) or 60 minutes (2nd gen)
   - Background jobs need workarounds

2. **GPU/ML Workloads**
   - No GPU access in serverless functions
   - Expensive to run ML inference

3. **Complex Data Processing**
   - Limited memory (up to 8GB for 2nd gen functions)
   - No persistent storage beyond databases

4. **Stateful Applications**
   - WebSockets have limitations
   - Real-time features require Firestore or third-party services

---

## When to Choose Self-Hosted Kubernetes

### ✅ Good Fit

1. **Complex Applications**
   - Multi-service architectures
   - Long-running background jobs
   - Custom infrastructure requirements

2. **GPU/ML Workloads**
   - LLM inference (Ollama, vLLM)
   - Image processing
   - ML training

3. **Learning & Experimentation**
   - Hands-on K8s experience
   - DevOps skill building
   - Full control for prototyping

4. **Cost Optimization at Scale**
   - Serverless becomes expensive at high traffic
   - Dedicated hardware amortizes over time

### ❌ Poor Fit

1. **Production-Critical Services**
   - Single point of failure (one machine)
   - No built-in redundancy
   - Manual disaster recovery

2. **Limited Time/Expertise**
   - Requires DevOps knowledge
   - Ongoing maintenance burden
   - Security patching responsibility

3. **Highly Variable Traffic**
   - Can't auto-scale beyond hardware limits
   - Over-provisioning wastes resources

4. **Budget-Constrained Projects**
   - Upfront hardware cost
   - Electricity costs
   - Internet bandwidth costs

---

## Hybrid Approach: Best of Both Worlds

My setup uses **both** strategies strategically:

### Portfolio (Firebase)
- **Why:** Static site with simple backend
- **Benefits:** Zero cost, zero maintenance, global CDN
- **Trade-off:** Limited to serverless constraints

### Blog (Self-Hosted)
- **Why:** Complex features (GPU LLM, ML training, orchestration)
- **Benefits:** Full control, GPU access, cost-effective for compute-heavy tasks
- **Trade-off:** Manual infrastructure management

**Result:** Each site uses the architecture that best matches its requirements.

---

## Cost Analysis

### Portfolio (Firebase)

**Monthly Costs:**
```
Firebase Hosting:    $0 (free tier)
Cloud Functions:     $0 (free tier)
Firestore:           $0 (free tier)
BigQuery:            $0 (free tier)
──────────────────────────────────
Total:               $0/month
```

**Traffic Capacity:**
- 10GB hosting/month (enough for ~50k visitors)
- 2M function invocations/month
- 50k Firestore reads/day

---

### Blog (Self-Hosted)

**Hardware:**
- Mini PC: $500 one-time (amortized over 3 years = $14/month)

**Monthly Costs:**
```
Electricity:         ~$5/month
Internet:            $0 (existing home internet)
Domain:              $12/year = $1/month
──────────────────────────────────
Total:               ~$6/month
```

**Effective Cost:**
- Including amortized hardware: ~$20/month
- After 3 years (hardware paid off): ~$6/month

**Capabilities:**
- 64GB RAM for memory-intensive workloads
- GPU for LLM inference (8-12 tokens/sec with Gemma 3 12B)
- Unlimited compute within hardware constraints
- Full Kubernetes cluster for learning/experimentation

---

## Lessons Learned

### From Firebase (Portfolio)

**1. Serverless Isn't Always Cheaper**

For low traffic, Firebase is free. But at scale:
- Cloud Functions: $0.40 per million invocations
- Firestore: $0.06 per 100k reads
- Firebase Hosting: $0.15 per GB

A high-traffic site could easily hit $100-500/month. Self-hosted becomes cheaper at that scale.

**2. Constraints Force Better Architecture**

Firebase's 60-second function timeout forced me to:
- Optimize database queries
- Use async processing (Pub/Sub)
- Design for idempotency

These are good practices regardless of platform.

**3. Managed Services Are Worth the Trade-Off**

Not managing servers means:
- No 3am wake-ups for outages
- No security patching
- No scaling configuration

For side projects, this is invaluable.

---

### From Self-Hosted K8s (Blog)

**1. Infrastructure Is a Learning Platform**

Running Kubernetes taught me:
- Container orchestration
- Networking (Traefik, DNS)
- GPU passthrough (ROCm)
- Storage management (PVCs)

These skills are directly applicable to enterprise environments.

**2. Control Comes With Responsibility**

With great power comes:
- Manual security updates
- Backup strategy implementation
- Monitoring configuration
- Troubleshooting hardware issues

You're the ops team.

**3. Hardware Limitations Are Real**

My mini PC can't:
- Handle massive traffic spikes
- Recover from hardware failure automatically
- Scale beyond 64GB RAM / 1 GPU

Trade-offs are real.

---

## Decision Framework

### Choose Firebase/Serverless If:
- Traffic is < 10k visitors/month
- Backend logic is simple (< 60 second execution)
- You value simplicity over control
- Budget is tight (free tier)
- You don't need GPU/ML capabilities

### Choose Self-Hosted K8s If:
- You have DevOps expertise
- You need GPU/ML workloads
- Traffic exceeds serverless cost-effectiveness
- You want full infrastructure control
- You're learning K8s for career growth

---

## Future Evolution

### Portfolio (Firebase)
- **Stay Serverless:** Traffic doesn't justify self-hosting
- **Potential Migration:** If traffic 10x, consider migrating to Cloudflare Pages (more generous free tier)

### Blog (Self-Hosted K8s)
- **Hardware Upgrade:** Potentially add second node for redundancy
- **Cloud Hybrid:** Offload static assets to Cloudflare R2 (free egress)
- **Managed K8s:** If traffic grows, migrate to GKE/EKS with spot instances

---

## Conclusion

There's no universal "best" deployment strategy. The right choice depends on:
- **Traffic:** Low traffic favors serverless, high traffic favors self-hosted
- **Complexity:** Simple apps fit serverless, complex workloads need control
- **Budget:** Free tiers are hard to beat, but self-hosted scales better
- **Expertise:** Serverless abstracts complexity, K8s demands knowledge

My hybrid approach uses:
- **Serverless** for the portfolio (simple, low-cost, zero-maintenance)
- **Self-hosted K8s** for the blog (complex, GPU-enabled, learning platform)

Each site uses the infrastructure that matches its needs. That's the key lesson: **match your architecture to your constraints**, not your aspirations.

---

*Portfolio:* [sudharsana.dev](https://www.sudharsana.dev)
*Blog:* [blog.sudharsana.dev](https://blog.sudharsana.dev)
