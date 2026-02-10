---
title: "Deploying to the Cloud: My Infrastructure Journey"
date: 2024-02-20
tags: [cloud, deployment, infrastructure, devops, gcp, firebase]
excerpt: "From GCS buckets and expensive load balancers to Firebase's serverless architecture. A journey through cost optimization, architecture decisions, and lessons learned deploying a production portfolio site."
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

## Lessons Learned

### 1. Right-Size Your Infrastructure

Don't deploy Kubernetes for a static site. Don't use enterprise load balancers for hobby projects. Match your infrastructure to your actual needs.

### 2. Free Tiers Are Production-Ready

Firebase's free tier isn't a toy—it's genuinely production-capable for small-to-medium traffic sites.

### 3. Serverless Reduces Operational Overhead

No servers to patch. No SSH keys to manage. No uptime monitoring to configure.

---

*Portfolio: [www.sudharsana.dev](https://www.sudharsana.dev)*
