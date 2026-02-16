---
title: "Two Sites, Two Paths"
date: 2025-08-04
tags: [infrastructure, deployment, cloud, self-hosting, devops, kubernetes]
excerpt: "Firebase for a serverless portfolio versus a self-hosted Kubernetes cluster for a full-featured blog. Why I chose different deployment strategies for different needs, and what I learned from each."
slug: two-sites-two-paths
readTime: 5
---

> "The best infrastructure is the one that matches your constraints."

I run production websites built on completely different philosophies. Two of them represent opposite ends of the deployment spectrum.

My portfolio at https://sudharsana.dev runs on Firebase. It is fully serverless and costs me essentially nothing to operate.

This blog runs on a mini PC in my apartment on a K3s Kubernetes cluster, backed by PostgreSQL, fronted by Cloudflare, and with a Radeon GPU doing local LLM inference.

This is not a cloud versus homelab argument. It is a constraints and intent argument. Each stack exists for a reason.

## Why I Built Them This Way

I work on data engineering and backend systems professionally, but most of that happens inside large organizations where many layers are abstracted away. I wanted at least a couple of projects where I own the entire path from code to DNS record.

Not to read about it. To run it. To break it. To fix it.

There is a big difference between knowing how systems work and feeling the consequences when they do not.

Owning the full stack forces you to think about things that rarely show up in tutorials. DNS propagation delays. TLS renewal. Cache invalidation. What happens when your only node runs out of memory. What a timeout really means when a user is waiting on the other side of the world.

I also lean heavily on AI for scaffolding, first drafts, and documentation. It lets me try more ideas in less time, but the responsibility for design decisions is still mine.

## The Portfolio on Firebase

My portfolio is a React SPA with a contact flow, analytics, and an AI powered job fit evaluator. It is important that it is fast, reliable, and boring from an operations perspective.

Firebase fits that goal.

Hosting is global by default. SSL is automatic. Deployments are one command. The platform handles scaling, certificates, and edge delivery. I do not think about servers, and that is the point.

The architecture is simple. Static assets on Firebase Hosting. A few Cloud Functions for backend logic. Firestore for data. BigQuery for analytics. The whole system is designed to minimize operational surface area.

Deploying feels almost anticlimactic.

```bash
firebase deploy
```

That single command pushes to a global CDN with HTTPS configured correctly. Ten years ago this would have taken hours and several chances to misconfigure something.

I did not choose Firebase because the docs looked nice. I chose it because the workload is spiky, the logic is lightweight, and the value of my time is higher than the value of micro optimizing hosting costs at this scale. Serverless also gives me strong isolation and predictable behavior under traffic bursts.

For a personal portfolio, those tradeoffs are perfect.

### Firebase Architecture

![Firebase serverless architecture showing user flow through Firebase Hosting, Cloud Functions, Firestore, and BigQuery](/assets/images/firebase-architecture.svg)

## The Blog on Self Hosted Kubernetes

The blog solves a different problem. I wanted server side rendering, background jobs, real time style features, and local LLM inference on a GPU. I also wanted a playground for infrastructure skills.

So I built a small homelab.

A mini PC runs Ubuntu and K3s. The app layer is Bun.js. Data lives in PostgreSQL. Ollama handles LLM inference. Dagster orchestrates background jobs. Prometheus and Grafana provide observability.

Cloudflare sits in front for DNS, TLS, and caching.

All deployments are GitOps driven. I push to main, CI builds the image, and FluxCD reconciles the cluster state. My production environment is literally a Git repository plus a small box under my desk.

This setup gives me full control. It also gives me full responsibility. If the node goes down, the site goes down. There is no multi region failover. No magical autoscaling. Just my configuration and my monitoring.

That tradeoff is intentional. This system is as much a lab as it is a blog.

### Self-Hosted Kubernetes Architecture

![Self-hosted K3s cluster architecture showing Cloudflare tunnel to homelab with Ingress, Blog, PostgreSQL, Ollama, Dagster, and monitoring components](/assets/images/self-hosted-k8s-architecture.svg)

### GitOps Deployment Flow

![Automated GitOps deployment pipeline from Git push through GitHub Actions, Container Registry, FluxCD to K3s cluster](/assets/images/gitops-deployment-flow.svg)

## Cost Reality

The portfolio is effectively free at my scale. If traffic exploded, costs would scale with it, but that would be a good problem to have.

The blog has a fixed cost. Electricity plus hardware amortization. Roughly the price of a couple of coffees a month in power, and a larger upfront hardware cost spread over years.

What I get in return is a private Kubernetes environment, a GPU for experiments, and a safe place to learn by doing. For me, that is worth it.

### Cost Comparison

![Monthly operating cost comparison between Firebase and self-hosted solutions with tradeoffs](/assets/images/cost-comparison.svg)

## Things That Broke

Things always break. That is where most learning happens.

I saw random 502 errors during traffic spikes. The issue turned out to be ingress timeouts that were too aggressive for cold starts. Increasing proxy timeouts stabilized it.

I shipped new CSS and users still saw the old version. That was a double caching problem between browsers and Cloudflare. Versioned asset URLs fixed it.

I had pods evicted because my memory limits were unrealistic for a single node cluster. Adding sane limits and a swap file reduced the pressure.

None of these were exotic failures. They were normal systems behaving exactly as configured. That is the lesson.

## What Each Taught Me

Firebase taught me to respect constraints. Short timeouts and usage based pricing push you toward efficient queries, idempotent design, and asynchronous thinking. It rewards simplicity.

Kubernetes taught me how many moving parts exist between code and a response in a browser. Networking, storage, scheduling, observability. It also taught me humility. Distributed systems do not care about your confidence.

Both taught me that owning your domain and deployment pipeline changes how you think about software. You stop seeing code as the product and start seeing the system as the product.

## The Hybrid Mindset

I do not think cloud first or homelab first. I think use case first.

If something can be simple, I keep it simple. If something needs control or serves as a learning platform, I accept the complexity.

The goal is not to run the most impressive stack. The goal is to build systems that make sense for their job and to learn something real along the way.

There is no universal answer. There is only context.

---

Portfolio: https://www.sudharsana.dev
Blog: https://blog.sudharsana.dev
