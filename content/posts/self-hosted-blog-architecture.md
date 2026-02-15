---
title: "Building a Production K3s Blog: Architecture Deep Dive"
date: 2025-06-15
tags: [kubernetes, k3s, self-hosting, infrastructure, monitoring, gitops, devops]
excerpt: "From a mini PC to a full production blog platform. Deep dive into the K3s architecture, monitoring stack, GitOps deployment, and lessons learned running a self-hosted blog on a homelab cluster."
slug: k3s-blog-architecture
readTime: 8
---

> "The best way to learn infrastructure is to own every layer of it."

## Two Production Websites, Two Philosophies

I run two production sites built on completely different philosophies:

**Portfolio ([sudharsana.dev](https://sudharsana.dev))**: Firebase Hosting, Cloud Functions, Firestore. Zero infrastructure management. Deploy with `firebase deploy`. Scales automatically. Economically rational.

**Blog ([blog.sudharsana.dev](https://blog.sudharsana.dev))**: Self-hosted on a mini PC. K3s cluster. Manual everything. SSH to fix issues. Monitor resource usage. Understand every component from bootloader to ingress controller. Educationally valuable.

The portfolio is the smart economic choice. Firebase is cheap, reliable, maintained by Google. The blog is the smart learning choice. I learn by breaking things, fixing state drift, debugging OOM kills. Most blogs run on WordPress, Ghost, Medium. But I wanted to understand production Kubernetes at a level you don't get from tutorials or managed services.

This is the full technical breakdown of running a production blog on K3s.

## The Stack

**Hardware**: Compact mini PC with integrated GPU, 64GB RAM. Single-node K3s cluster. Lives under my desk. Draws about 35W idle, 65W under load. Efficient enough to run 24/7 without breaking the bank.

**Software**: K3s Kubernetes, FluxCD for GitOps, Bun.js for the blog application, PostgreSQL for data, Prometheus + Grafana + Loki for observability, Cloudflare for DNS and edge caching.

Everything is declarative. Git is the source of truth. Changes get committed, FluxCD reconciles, pods update. No manual kubectl apply. No SSH sessions to fix state drift. Just git commits and automatic sync.

## Architecture Overview

Multiple namespaces: `web` for user services, `monitoring` for observability, `orchestrator` for Dagster jobs, `flux-system` for GitOps. Each namespace is isolated with resource quotas and network policies.

### Complete Architecture

![K3s Blog Cluster Architecture](/assets/images/k3s-blog-complete-architecture.svg)

## The Blog Application

Bun.js serves the blog. Server-side rendering for each request. Reads markdown files from the content directory, parses frontmatter, renders HTML with syntax highlighting. Fast. Simple. No client-side JavaScript hydration needed.

PostgreSQL stores metadata. Blog posts, tags, view counts, comment metadata. The app reads markdown from disk but queries Postgres for indexes, relationships, and aggregations.

Deployment runs 2 replicas behind a load balancer. HPA (Horizontal Pod Autoscaler) scales from 2 to 5 pods based on CPU utilization. Rarely hits 3. Traffic is modest.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog
  namespace: web
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: blog
        image: sudhan03/blog:latest
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

FluxCD watches the container registry. When CI pushes a new image, FluxCD detects the tag change and updates the deployment. Rollout happens automatically. Old pods terminate gracefully after new ones pass health checks.

## GitOps with FluxCD

Every Kubernetes manifest lives in a Git repository. Deployments, services, ingresses, secrets (encrypted), config maps. FluxCD runs in the cluster, polls the repo every minute, applies changes.

The workflow: edit YAML locally, commit and push to main, FluxCD detects the change, applies the diff to the cluster, pods restart with new config. No manual kubectl apply. No imperative changes. If cluster state drifts from Git, FluxCD corrects it automatically. Disaster recovery is cloning the repo and pointing FluxCD at it.

### GitOps Flow

![GitOps Deployment Flow](/assets/images/k3s-gitops-flow.svg)

## Data Layer

PostgreSQL runs as a StatefulSet with a persistent volume. 50GB SSD-backed storage. Single replica. Not highly available, but the failure domain is acceptable for a blog.

Database schema supports content management and user engagement:
- `posts` and `tags` for blog metadata
- `comments` with `client_id` tracking for anonymous identity persistence
- `page_views`, `events`, `user_sessions` for in-house analytics
- `newsletter_subscribers` and `comment_summaries` for AI insights

Automated backups run daily via CronJob. Dumps to local PVC, rsyncs offsite. 30-day local retention, 90-day offsite. Connection pooling via PgBouncer keeps connections manageable and stable.

## Monitoring Stack

Observability is critical when you're the only ops person. I need to know when things break before users do.

**Prometheus** scrapes metrics from every pod. CPU, memory, request rates, error rates, custom business metrics. 15-day retention. Queries are fast. Dashboards are instant.

**Grafana** visualizes everything. Kubernetes cluster metrics, application performance, database queries, ingress traffic. Custom dashboards for blog-specific KPIs: posts published, page views, comment rates.

**Loki** aggregates logs. Every pod streams logs to Loki via Promtail. Queryable, indexed, correlated with traces. Errors surface immediately. Debugging is grep on steroids.

**Blackbox Exporter** monitors external endpoints. Hits the blog URL every 30 seconds, records latency and uptime. Alerts fire if the site is down for more than 2 minutes.

### Monitoring Architecture

![Monitoring Stack Architecture](/assets/images/k3s-monitoring-stack.svg)

Alerts go to Gotify (self-hosted notification server). Critical alerts hit my phone. Warning alerts batch to hourly summaries. I don't wake up for minor issues, but I know when the cluster is truly broken.

## In-House Analytics

Custom analytics stored in PostgreSQL. No third-party trackers. GDPR-compliant with explicit consent.

Tracks page views, link clicks, scroll depth, and time on page. Anonymous UUIDs in localStorage (no IPs, no PII). Events batch in groups of 5 or on page unload via `sendBeacon`. Indexed tables for user sessions, page views, and custom events. Fast queries, indefinite retention, no sampling.

## Ingress and Networking

Traefik ingress routes by Host header. TLS via cert-manager with Let's Encrypt auto-renewal. Cloudflare CDN + DDoS protection in front, proxying through Cloudflare Tunnel (no exposed home IP).

Traffic: User → Cloudflare → Tunnel → Traefik → Service → Pod. Latency 50-100ms domestic. Edge caching for assets, fresh HTML for SEO.

## Resource Management

Single-node clusters are resource-constrained. 64GB RAM sounds like a lot until you run Prometheus, Grafana, Loki, PostgreSQL, multiple app pods, and background jobs.

Resource requests and limits on every container prevent one service from starving others. Blog pods request 100m CPU and 128Mi memory. Under load, they can burst to 500m CPU and 512Mi memory.

Prometheus gets more resources. 1GB memory, 500m CPU. It stores 15 days of high-cardinality metrics. Grafana gets 512Mi memory for dashboards and query processing.

The Ollama LLM pod is the resource hog. 48Gi memory limit for the integrated GPU (which uses shared system RAM). The GPU requires specific environment variables and `/dev/kfd` device access for ROCm support. One wrong setting and it segfaults.

HPA prevents runaway scaling. Blog scales 2-5 pods. API scales 1-3 pods. I've hit the limits during traffic spikes (Reddit posts, Hacker News mentions). The cluster survived, but CPU throttling was visible.

## AI-Powered Features

The blog leverages local LLM inference for several user-facing features. No API costs, no rate limits, complete privacy.

### AI-Generated Display Names

First-time visitors get AI-generated usernames like "Aethyr-Wanderer-42857". Ollama (gemma3:12b, temperature 0.95) invents mythologically-inspired names from global traditions. 2-second timeout with cryptographic fallback. Names stored in localStorage with `client_id` tracking for cross-post identity. Users can update names retroactively across all posts. Unique enforcement prevents impersonation.

### Comment Moderation & Summarization

Async AI moderation (temperature 0.1) analyzes comments for harmful content. Non-blocking—appears immediately, rejected in background if flagged. Long threads get 2-3 sentence AI summaries via Dagster jobs, displayed as "What readers are saying."

## Ollama LLM Integration

All AI features run through a single Ollama deployment on the cluster's integrated GPU. Blog pods call Ollama over HTTP (`ollama-service.web:11434`). The Ollama pod runs the ROCm variant with proper GPU device access.

This setup is hybrid cloud-homelab. Firebase portfolio functions call my K3s cluster for LLM inference. No OpenAI API costs. Just electricity.

Getting ROCm working on an integrated GPU was non-trivial. The GPU architecture required specific environment variable overrides to bridge compatibility gaps. Without correct configuration, containers exit with segfaults.

```yaml
env:
- name: HSA_OVERRIDE_GFX_VERSION
  value: "11.0.0"  # Architecture compatibility bridge
```

## Deployment Strategy

Rolling updates via FluxCD. Readiness probes (`/health`) ensure 3 consecutive successes before routing traffic. Zero downtime in theory, occasional blips in practice. Rollbacks via Git commit pinning or kubectl rollout undo.

## Persistent Storage

Local path provisioner on the mini PC's SSD. PostgreSQL (50GB), Grafana (10GB), Loki (20GB), Ollama (30GB). Total ~110GB of 1TB used. Daily database dumps, weekly cluster exports, offsite rsync. RTO under 1 hour.

## Security Model

Network policies restrict pod-to-pod communication (deny by default). Kubernetes Secrets with SOPS encryption for Git-tracked YAML. Trivy image scanning in CI (critical vulns block deployment). Dependabot for dependencies, quarterly K3s upgrades, unattended Ubuntu updates.

## Things That Broke

Pod OOMKills from low memory limits. AMD GPU MES corruption requiring reboots. FluxCD drift from manual kubectl apply (never bypass GitOps). Let's Encrypt rate limits. Ingress routing conflicts from overlapping paths. Normal operations gone wrong. Systems break when you violate assumptions.

## What This Taught Me

**Kubernetes is not magic.** It's state reconciliation with better tooling. The learning curve is steep, but the primitives make sense once you stop fighting them.

**Observability is non-negotiable.** Logs, metrics, traces. You need all three. When the blog is slow, I check Grafana. When errors spike, I query Loki. When deployments fail, I check FluxCD logs. No observability, no operations.

**GitOps changes how you think about infrastructure.** Instead of "how do I fix this broken pod," I ask "what Git commit caused this state?" The answer is always in the diff.

**Single-node clusters are viable.** With proper resource limits, monitoring, and backups, a mini PC can run a production blog. Uptime is 99.5%. Good enough for a personal project.

**Self-hosting isn't cheaper, but it's more valuable.** Electricity, hardware amortization, time investment. Economically, Firebase wins. Educationally, self-hosting wins. I know this stack deeply because I built it, broke it, and fixed it.

## Performance Metrics

**Uptime**: 99.5% over the last 6 months. Downtime was planned upgrades and one power outage.

**Response time**: P50 is 80ms. P95 is 110ms. P99 is 120ms. Static assets are faster due to Cloudflare caching.

**Resource utilization**: Average CPU 2%. Average memory 10GB of 64GB (16%). Disk I/O is negligible except during backups.

**Cost**: $5/month in electricity. $500 hardware amortized over 5 years = $8.33/month. Total: ~$13/month for a full homelab.

## What's Next

The platform is stable. No major architectural changes planned. Possible enhancements:

- Multi-node cluster with a second mini PC for high availability
- External Secrets Operator for better secrets management
- Service mesh (Linkerd) for advanced traffic management and mTLS
- Automated DR testing to validate backup/restore procedures

But honestly? The system works. It's fast, reliable, observable, and maintainable. Sometimes the best infrastructure decision is to stop iterating and focus on content instead.

---

**Cluster Infrastructure**: [GitHub Repo](https://github.com/sudhan30/my-blog-site-cluster-infra)
**Blog**: [blog.sudharsana.dev](https://blog.sudharsana.dev)
