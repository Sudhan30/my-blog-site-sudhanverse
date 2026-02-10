---
title: "Deploying to the Cloud: My Infrastructure Journey"
date: 2024-02-20
tags: [cloud, deployment, infrastructure, devops, gcp, firebase, kubernetes, self-hosting]
excerpt: "From expensive load balancers to Firebase's serverless architecture, and eventually running a self-hosted Kubernetes cluster. A journey through cost optimization, architecture decisions, and lessons learned deploying two production sites with fundamentally different strategies."
slug: my-cloud-site
---

> "Cost optimization isn't about being cheap—it's about being smart with resources."

The journey from hosting a static website to building a production-ready, globally-distributed application taught me that cloud architecture is as much about economics as it is about engineering.

## The Problem: A $20/Month Static Website

My portfolio website started simple—HTML, CSS, JavaScript. Nothing fancy. But when it came time to deploy, I made a classic beginner mistake: over-engineering the infrastructure for what was essentially a static site.

### Initial Architecture: GCS + Load Balancer

**The Setup:**
- Google Cloud Storage bucket for static files
- Cloud Load Balancer for HTTPS termination
- Custom domain via Cloudflare DNS

**The Cost:**
```
Google Cloud Load Balancer:  $18.00/month (fixed minimum)
Cloud Storage Bucket:         $0.50/month
Data Transfer (egress):       $1.00/month
──────────────────────────────────────────────
Total:                       ~$21.50/month
```

**The Problem:** 97% of the cost was the load balancer doing almost nothing for a low-traffic site.

---

## The Pivot: Discovering Firebase Free Tier

After analyzing the bills, I realized I needed a platform that:
1. Served static content globally via CDN
2. Handled HTTPS automatically
3. **Cost close to zero for low traffic**
4. Could scale if needed

Firebase Hosting checked all boxes.

### Firebase Architecture

![Firebase Portfolio Architecture](/assets/images/firebase-architecture.svg?v=1)

**Key Components:**

| Component | Purpose | Cost (Free Tier) |
|-----------|---------|------------------|
| **Firebase Hosting** | Static site hosting + global CDN | Free up to 10GB/month |
| **Cloudflare DNS** | Domain management + DDoS protection | Free |
| **Cloud Functions** | Serverless backend APIs | Free 2M invocations/month |
| **Firestore** | NoSQL database for forms/analytics | Free 50k reads/day |
| **Secret Manager** | Secure credential storage | Free for < 6 secrets |

**Monthly Cost:** $0 (well within free tier limits)

**Traffic Capacity:** ~50k monthly visitors before exceeding free tier

---

## Evolution: Adding a Self-Hosted Blog

While the Firebase portfolio worked perfectly, I eventually built a second site—a full-featured blog—that required capabilities Firebase couldn't provide: GPU-accelerated LLM inference, complex orchestration, and long-running ML training jobs.

This led to a hybrid architecture:
- **Portfolio** ([sudharsana.dev](https://sudharsana.dev)): Firebase Hosting, serverless, $0/month
- **Blog** ([blog.sudharsana.dev](https://blog.sudharsana.dev)): Self-hosted Kubernetes on a mini PC, full control

---

## Tale of Two Sites

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

### 1. Right-Size Your Infrastructure

Don't deploy Kubernetes for a static site. Don't use enterprise load balancers for hobby projects. Match your infrastructure to your actual needs.

My hybrid approach proves this: the portfolio stays serverless because it doesn't need more, while the blog runs on K8s because it genuinely requires GPU and complex orchestration.

### 2. Free Tiers Are Production-Ready

Firebase's free tier isn't a toy—it's genuinely production-capable for small-to-medium traffic sites. My portfolio has been running on Firebase's free tier for years with zero issues.

### 3. Serverless Reduces Operational Overhead

No servers to patch. No SSH keys to manage. No uptime monitoring to configure.

For side projects, this is invaluable. But when you need capabilities serverless can't provide (GPU, long-running jobs), the operational overhead becomes worth it.

### 4. Serverless Isn't Always Cheaper

For low traffic, Firebase is free. But at scale:
- Cloud Functions: $0.40 per million invocations
- Firestore: $0.06 per 100k reads
- Firebase Hosting: $0.15 per GB

A high-traffic site could easily hit $100-500/month. Self-hosted becomes cheaper at that scale.

### 5. Constraints Force Better Architecture

Firebase's 60-second function timeout forced me to:
- Optimize database queries
- Use async processing (Pub/Sub)
- Design for idempotency

These are good practices regardless of platform.

### 6. Infrastructure Is a Learning Platform

Running Kubernetes taught me:
- Container orchestration
- Networking (Traefik, DNS)
- GPU passthrough (ROCm)
- Storage management (PVCs)

These skills are directly applicable to enterprise environments.

### 7. Control Comes With Responsibility

With great power comes:
- Manual security updates
- Backup strategy implementation
- Monitoring configuration
- Troubleshooting hardware issues

You're the ops team.

### 8. Hardware Limitations Are Real

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

## Conclusion

There's no universal "best" deployment strategy. The right choice depends on:
- **Traffic:** Low traffic favors serverless, high traffic favors self-hosted
- **Complexity:** Simple apps fit serverless, complex workloads need control
- **Budget:** Free tiers are hard to beat, but self-hosted scales better
- **Expertise:** Serverless abstracts complexity, K8s demands knowledge

My journey went from over-engineered (GCS + Load Balancer at $21/month for a static site) to optimized (Firebase at $0/month for the portfolio, self-hosted K8s for the blog's complex workloads).

Each site uses the infrastructure that matches its needs. That's the key lesson: **match your architecture to your constraints**, not your aspirations.

---

*Portfolio:* [sudharsana.dev](https://www.sudharsana.dev)
*Blog:* [blog.sudharsana.dev](https://blog.sudharsana.dev)
