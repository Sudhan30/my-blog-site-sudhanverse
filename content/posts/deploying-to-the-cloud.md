---
title: "Deploying to the Cloud: My Infrastructure Journey"
date: 2025-02-20
tags: [cloud, deployment, infrastructure, devops, gcp, firebase]
excerpt: "From GCS buckets and expensive load balancers to Firebase's serverless architecture. A journey through cost optimization, architecture decisions, and lessons learned deploying a production portfolio site."
slug: my-cloud-site
---

> "Cost optimization isn't about being cheap—it's about being smart with resources."

Learning cloud architecture is as much about economics as it is about engineering. My portfolio website started simple—HTML, CSS, JavaScript. But when it came time to deploy, I made the classic beginner mistake: over-engineering the infrastructure for what was basically a static site.

## The $20/Month Static Website Problem

I set up a Google Cloud Storage bucket for the static files and put a Cloud Load Balancer in front of it for HTTPS. Custom domain through Cloudflare DNS. Felt pretty professional.

Then the bill came. $18 a month for the load balancer alone. Another $0.50 for storage, $1 for data transfer. Total: ~$21.50/month. For a static site getting maybe 100 visitors a month.

97% of my cost was the load balancer doing almost nothing.

## Finding Firebase

After a few months of those bills, I started looking for alternatives. What I needed was simple: serve static content globally, handle HTTPS automatically, cost close to zero for low traffic, and scale if needed.

Firebase Hosting checked all those boxes.

![Firebase Portfolio Architecture](/assets/images/firebase-architecture.svg?v=1)

The free tier is genuinely generous. 10GB hosting per month, 2 million Cloud Function invocations, 50k Firestore reads per day. For a personal portfolio, that's more than enough. I've been running on Firebase's free tier for over a year now without hitting limits.

Google handles the CDN, HTTPS certificates, and deployments. I just push code. The site loads fast from anywhere in the world, and my monthly bill is $0.

## What I Learned

Don't deploy enterprise infrastructure for hobby projects. Kubernetes for a static site? Load balancers for low traffic? Match your infrastructure to your actual needs, not what you think production should look like.

Firebase's free tier isn't a toy. It's production-capable for small to medium traffic. My portfolio has been running on it for years with zero issues. No 3am wake-up calls, no server patches, no SSH keys to manage.

Serverless reduces operational overhead dramatically. When you're building side projects, that matters. The time you save not managing infrastructure is time you can spend building features or, you know, doing other things with your life.

---

*Portfolio: [www.sudharsana.dev](https://www.sudharsana.dev)*
