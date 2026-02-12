---
title: "Building a Production K3s Blog: Architecture Deep Dive"
date: 2025-06-15
tags: [kubernetes, k3s, self-hosting, infrastructure, monitoring, gitops, devops]
excerpt: "From a mini PC to a full production blog platform. Deep dive into the K3s architecture, monitoring stack, GitOps deployment, and lessons learned running a self-hosted blog on a homelab cluster."
slug: k3s-blog-architecture
---

> "The best way to learn infrastructure is to own every layer of it."

Most blogs run on managed platforms. WordPress, Ghost, Medium. Simple, reliable, managed. But I wanted to understand production Kubernetes at a level you don't get from tutorials or managed services.

So I built a blog platform on a mini PC running K3s. This is the full technical breakdown.

## The Stack

**Hardware**: AMD UM790 mini PC. Phoenix1 APU (gfx1103), Radeon 780M iGPU, 64GB RAM. Single-node K3s cluster. Lives under my desk. Draws about 35W idle, 65W under load.

**Software**: K3s Kubernetes, FluxCD for GitOps, Bun.js for the blog application, PostgreSQL for data, Prometheus + Grafana + Loki for observability, Cloudflare for DNS and edge caching.

Everything is declarative. Git is the source of truth. Changes get committed, FluxCD reconciles, pods update. No manual kubectl apply. No SSH sessions to fix state drift. Just git commits and automatic sync.

## Architecture Overview

The cluster runs multiple namespaces. `web` for user-facing services (the blog, chat application, portfolio backend). `monitoring` for observability. `orchestrator` for Dagster jobs. `flux-system` for GitOps.

Each namespace is isolated. Resource quotas prevent runaway processes. Network policies restrict cross-namespace communication to what's explicitly needed.

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

The workflow:
1. Edit YAML locally
2. Commit and push to main
3. FluxCD detects the change
4. Applies the diff to the cluster
5. Pods restart with new config

No manual kubectl apply. No imperative changes. If the cluster state drifts from Git, FluxCD corrects it. Disaster recovery is cloning the repo and pointing FluxCD at it.

### GitOps Flow

![GitOps Deployment Flow](/assets/images/k3s-gitops-flow.svg)

## Data Layer

PostgreSQL runs as a StatefulSet with a persistent volume. 50GB SSD-backed storage. Single replica. Not highly available, but the failure domain is acceptable. This is a blog, not a payment system.

Database schema is simple:
- `posts` table for blog metadata
- `tags` table for categories
- `comments` table for reader interactions
- `page_views` table for analytics

Automated backups run daily via a CronJob. Dumps to a local PVC, then rsyncs to an offsite location. Retention is 30 days local, 90 days offsite.

```sql
-- Core tables
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'draft'
);

CREATE TABLE tags (
  name TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
);

CREATE TABLE post_tags (
  post_id TEXT REFERENCES posts(id),
  tag_name TEXT REFERENCES tags(name),
  PRIMARY KEY (post_id, tag_name)
);
```

Connection pooling via PgBouncer keeps connections manageable. Blog pods hit PgBouncer, which maintains a pool to Postgres. Efficient, stable, no connection churn.

## Monitoring Stack

Observability is critical when you're the only ops person. I need to know when things break before users do.

**Prometheus** scrapes metrics from every pod. CPU, memory, request rates, error rates, custom business metrics. 15-day retention. Queries are fast. Dashboards are instant.

**Grafana** visualizes everything. Kubernetes cluster metrics, application performance, database queries, ingress traffic. Custom dashboards for blog-specific KPIs: posts published, page views, comment rates.

**Loki** aggregates logs. Every pod streams logs to Loki via Promtail. Queryable, indexed, correlated with traces. Errors surface immediately. Debugging is grep on steroids.

**Blackbox Exporter** monitors external endpoints. Hits the blog URL every 30 seconds, records latency and uptime. Alerts fire if the site is down for more than 2 minutes.

### Monitoring Architecture

![Monitoring Stack Architecture](/assets/images/k3s-monitoring-stack.svg)

Alerts go to Gotify (self-hosted notification server). Critical alerts hit my phone. Warning alerts batch to hourly summaries. I don't wake up for minor issues, but I know when the cluster is truly broken.

## Ingress and Networking

Traefik is the ingress controller. Routes HTTP traffic based on Host headers. `blog.sudharsana.dev` → blog service. `grafana.sudharsana.dev` → Grafana. `api.sudharsana.dev` → backend API.

TLS termination happens at Traefik via cert-manager. Let's Encrypt certificates, automated renewal. HTTPS everywhere. Redirect loops and certificate errors taught me more about TLS than any book.

Cloudflare sits in front as a CDN and DDoS shield. DNS points to Cloudflare. Cloudflare proxies to my home IP via a Cloudflare Tunnel. No port forwarding. No exposed home IP. Secure, simple, free.

Traffic flow:
1. User hits `blog.sudharsana.dev`
2. Cloudflare DNS resolves
3. Request proxied through Cloudflare Tunnel
4. Traefik receives, terminates TLS
5. Routes to blog service
6. Load balancer picks a pod
7. Bun.js renders HTML
8. Response flows back

Latency is surprisingly low. 50-100ms for domestic requests. Cloudflare edge caching helps. Most assets are cached. HTML is not. SEO and freshness matter more than speed for static content.

## Resource Management

Single-node clusters are resource-constrained. 64GB RAM sounds like a lot until you run Prometheus, Grafana, Loki, PostgreSQL, multiple app pods, and background jobs.

Resource requests and limits on every container prevent one service from starving others. Blog pods request 100m CPU and 128Mi memory. Under load, they can burst to 500m CPU and 512Mi memory.

Prometheus gets more resources. 1GB memory, 500m CPU. It stores 15 days of high-cardinality metrics. Grafana gets 512Mi memory for dashboards and query processing.

The Ollama LLM pod is the resource hog. 48Gi memory limit for the iGPU (shared system RAM). AMD gfx1103 requires `HSA_OVERRIDE_GFX_VERSION=11.0.0` and `/dev/kfd` device access. One wrong setting and it segfaults.

HPA prevents runaway scaling. Blog scales 2-5 pods. API scales 1-3 pods. I've hit the limits during traffic spikes (Reddit posts, Hacker News mentions). The cluster survived, but CPU throttling was visible.

## Ollama LLM Integration

The blog has an AI-powered comment summarization feature. Ollama runs Llama 3 on the AMD iGPU. Blog pods call the Ollama API over HTTP to summarize comment threads.

This setup is hybrid cloud-homelab. Firebase portfolio functions call my K3s cluster for LLM inference. No OpenAI API costs. Just electricity.

Getting AMD ROCm working on the Phoenix1 APU was painful. The GPU reports as gfx1103, but ROCm libraries expect gfx1100. The override environment variable bridges the gap. Without it, containers exit 139 (segfault).

```yaml
env:
- name: HSA_OVERRIDE_GFX_VERSION
  value: "11.0.0"
```

## Deployment Strategy

Rolling updates are the default. FluxCD updates the deployment, Kubernetes creates new pods, waits for readiness, then terminates old pods. Zero downtime in theory. Occasional connection blips in practice.

Readiness probes prevent premature traffic routing. The blog exposes `/health` that returns 200 when the app is ready. Kubernetes waits for 3 consecutive successes before adding the pod to the load balancer.

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

Rollbacks are manual but fast. FluxCD can pin to a previous Git commit, reapply manifests, and restore the old state. Alternatively, kubectl rollout undo works for quick reverts.

## Persistent Storage

Local path provisioner handles persistent volumes. Data lives on the mini PC's SSD. Not replicated. Not distributed. Just local storage with automatic directory management.

PostgreSQL mounts a 50GB volume. Grafana dashboards mount 10GB. Loki logs mount 20GB. Ollama models mount 30GB. Total ~110GB used of 1TB available.

Backups mitigate the single point of failure. Daily database dumps. Weekly full cluster state exports. Offsite copies via rsync. Recovery time objective is under 1 hour with the backup scripts.

## Security Model

**Network Policies**: Restrict pod-to-pod communication. Blog pods can talk to Postgres. Monitoring pods can scrape metrics. Everything else is denied by default.

**Secrets Management**: Kubernetes Secrets (base64-encoded, not great). Exploring External Secrets Operator to pull from a proper vault. For now, Git-tracked secrets are encrypted with SOPS (encrypted YAML, safe to commit).

**Image Scanning**: Trivy scans container images in CI. Critical vulnerabilities block deployment. High-severity issues get flagged for review.

**Updates**: Dependabot keeps dependencies current. K3s upgrades happen quarterly after testing in a VM. Unattended upgrades for the underlying Ubuntu system.

## Things That Broke

Kubernetes doesn't care about your confidence. It breaks in ways you don't expect.

**Pod evictions**: Memory limits were too low. Pods got OOMKilled under load. Increased limits and added swap as a buffer. Now stable.

**GPU state corruption**: AMD GPU MES errors required full system reboots. Can't recover from kernel GPU state without restarting. Rare, but painful.

**FluxCD drift**: A manual kubectl apply once caused FluxCD to reconcile incorrectly. Lesson: never bypass GitOps. Fixing the drift took an hour of diff comparison.

**Certificate renewal failures**: Let's Encrypt rate limits hit when I churned through domains testing. Waited a week, fixed configs, automated properly.

**Ingress routing conflicts**: Two services with overlapping path prefixes caused 404s. Fixed with explicit ordering and better path matching.

None of these were exotic. They were normal operations gone wrong. That's the lesson. Systems break predictably when you violate their assumptions.

## What This Taught Me

**Kubernetes is not magic.** It's state reconciliation with better tooling. The learning curve is steep, but the primitives make sense once you stop fighting them.

**Observability is non-negotiable.** Logs, metrics, traces. You need all three. When the blog is slow, I check Grafana. When errors spike, I query Loki. When deployments fail, I check FluxCD logs. No observability, no operations.

**GitOps changes how you think about infrastructure.** Instead of "how do I fix this broken pod," I ask "what Git commit caused this state?" The answer is always in the diff.

**Single-node clusters are viable.** With proper resource limits, monitoring, and backups, a mini PC can run a production blog. Uptime is 99.5%. Good enough for a personal project.

**Self-hosting isn't cheaper, but it's more valuable.** Electricity, hardware amortization, time investment. Economically, Firebase wins. Educationally, self-hosting wins. I know this stack deeply because I built it, broke it, and fixed it.

## Performance Metrics

**Uptime**: 99.5% over the last 6 months. Downtime was planned upgrades and one power outage.

**Response time**: P50 is 80ms. P95 is 200ms. P99 is 500ms. Static assets are faster due to Cloudflare caching.

**Resource utilization**: Average CPU 30%. Average memory 40GB of 64GB. Disk I/O is negligible except during backups.

**Cost**: $5/month in electricity. $800 hardware amortized over 5 years = $13.33/month. Total: ~$18/month for a full homelab.

## What's Next

The platform is stable. No major architectural changes planned. Possible enhancements:

- Multi-node cluster with a second mini PC for high availability
- External Secrets Operator for better secrets management
- Service mesh (Linkerd) for advanced traffic management and mTLS
- Automated DR testing to validate backup/restore procedures

But honestly? The system works. It's fast, reliable, observable, and maintainable. Sometimes the best infrastructure decision is to stop iterating and focus on content instead.

---

**Cluster Infrastructure**: [GitHub Repo](https://github.com/your-repo/cluster-infra)
**Blog**: [blog.sudharsana.dev](https://blog.sudharsana.dev)
