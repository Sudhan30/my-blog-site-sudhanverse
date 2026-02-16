---
title: "Building an AI Chat System with Practical Memory, Search, and Multimodal Intelligence"
date: 2025-10-20
tags: [ai, llm, architecture, backend, typescript]
excerpt: "A behind-the-scenes engineering deep dive into building a production AI chat system. Memory management, context compression, web search integration, and the infrastructure decisions that make it work."
slug: building-ai-chat-system
readTime: 8
---

> "Building AI products is less about a single model and more about the system around it."

Modern AI chat systems look simple on the surface. A text box, a response, maybe some formatting. Under the hood, a reliable production system is a careful orchestration of memory management, retrieval, rendering, and infrastructure decisions.

This post walks through how my chat platform was designed and why certain architectural choices were made. The goal was not just to make a chatbot that works, but to make one that **scales**, **feels natural**, and remains **cost efficient** while handling long-running conversations.

---

## The Core Philosophy

The system is built around three principles:

| # | Principle | Why It Matters |
|---|-----------|----------------|
| 1 | **Conversations should feel continuous** | Users shouldn't repeat themselves or feel like starting over |
| 2 | **Token usage must stay predictable** | Costs scale linearly with usage, not exponentially with length |
| 3 | **Features should degrade gracefully** | When something fails, the system continues working |

This leads to a design where memory is **curated, not hoarded**, and where context is treated as a **dynamic resource** rather than an ever-growing log.

---

## System Architecture Overview

Before diving into the details, here's a visual overview of how all the pieces fit together:

![Chat System Infrastructure & CI/CD](/assets/images/chat-architecture.svg?v=3)

The diagram shows the complete infrastructure:

**Runtime Flow (Top Section):**
- User requests flow through **Cloudflare** (DNS, CDN, SSL, DDoS protection) to the **Kubernetes cluster**
- Inside the cluster, the **Ingress Controller** routes traffic to the **Chat App Pod** running Bun/Hono
- The app communicates with the **Ollama Pod** (Gemma 3 12B model, GPU-accelerated) for LLM inference
- **PostgreSQL** stores messages, summaries, sessions, and users
- **Brave Search API** provides real-time web data when needed
- **Gotify** handles push notifications for user signups and admin approvals
- Background jobs handle async summarization

**CI/CD Pipeline (Bottom Section):**
- Code pushed to **GitHub** triggers **GitHub Actions**
- Actions build and push Docker images to **Docker Hub**
- The workflow updates the image tag in the **cluster-infra** repo (K8s manifests)
- **FluxCD** watches the repo and automatically deploys changes to the cluster

This GitOps approach ensures the cluster state always matches what's defined in Git.

---

## Smart Summarization and Practical Memory

One of the hardest problems in LLM applications is memory. Sending the entire chat history on every request quickly becomes expensive and slow.

**The solution is not infinite context windows, but intelligent compression.**

### How It Works

Long conversations are periodically summarized in the background. When a thread crosses a threshold, a background worker generates a structured summary that captures:

- User intent and goals
- Key facts and decisions
- Unresolved topics and questions

This summary is stored in a `conversation_summaries` table and becomes the canonical memory of earlier dialogue.

### Context Composition

![Context Composition Diagram](/assets/images/context-composition.svg?v=1)

This reduces token usage dramatically while preserving continuity. Instead of pretending to have infinite memory, the system maintains **useful** memory.

### Implementation Details

From an implementation perspective, this requires:

- **Asynchronous jobs** - Summarization runs in the background, never blocking responses
- **Idempotent logic** - Same input always produces same summary
- **Versioning** - Summaries can be regenerated if prompts evolve

```typescript
// Trigger summarization when threshold crossed
if (messageCount % SUMMARY_INTERVAL === 0) {
  // Run in background - don't block the response
  triggerSummarizationIfNeeded(sessionId).catch(err =>
    console.error('Background summarization failed:', err)
  );
}
```

---

## Markdown Rendering for Human-Friendly Output

Raw LLM text often looks messy in real products. **Formatting matters for trust and readability.**

Responses are rendered using markdown with support for:
- Code blocks with syntax highlighting
- Bold and italic emphasis
- Structured lists and tables
- Proper paragraphs and spacing

The renderer is strict about sanitization to avoid injection issues while still allowing rich formatting.

### The Separation of Concerns

```
Model Output → Sanitization → Markdown Parse → UI Components
     ↓              ↓              ↓               ↓
  Raw text    Security layer  Structure data   Visual render
```

The model is prompted to prefer structured markdown when appropriate. The frontend then renders this into clean UI components. This creates a clear separation between **generation** and **presentation**.

---

## Clean Links and Citation Hygiene

Dumping raw URLs into chat is a poor user experience. Instead, links are embedded naturally in text.

The model is guided to reference sources contextually rather than pasting long links:

```markdown
❌ Bad: "Check out https://example.com/very/long/path/to/article?utm=tracking"
✅ Good: "According to recent research, the trend shows..."
```

On the backend, link handling can be post-processed to ensure formatting consistency. This small detail significantly improves perceived quality.

---

## Location Awareness with Precision

Location context enables better answers for local queries. The system uses high-precision coordinates when available and converts them into semantic location context.

```typescript
// System prompt injection
USER'S LOCATION: San Francisco, United States
Coordinates: 37.7749, -122.4194

IMPORTANT: When the user asks about weather, local businesses,
or nearby places, use THIS location - NOT any other location.
```

### The Key Design Decision

Location is treated as **optional context, not a requirement**. If location is missing or imprecise, the system still functions normally. This avoids brittle behavior and privacy concerns.

Location data is never blindly injected—it's only used when the user's query is location-sensitive.

---

## Natural Greetings and Conversational Flow

Repetitive greetings are a common annoyance in AI chats.

```markdown
❌ Every response: "Hello Sudhan! Great question, Sudhan! Here's..."
✅ Natural flow: Greet once, then conversational tone
```

The system mitigates this by tracking conversational state and varying tone. Greeting logic is handled separately from core reasoning so that it doesn't pollute prompts or summaries.

---

## Web Search Integration

Web search is used as an **augmentation layer** for freshness. It is triggered **selectively** when queries require current or factual data.

### The Architecture

The architecture treats search as a **tool call**, not a default:

```
User Query
    ↓
┌─────────────────────┐
│ Should search web?  │ ← Keywords: "today", "weather", "current", etc.
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ↓           ↓
   [Yes]       [No]
     ↓           ↓
  Search →   Use training
  Filter     knowledge
  Inject
     ↓           ↓
     └─────┬─────┘
           ↓
    Generate Response
```

### Location-Aware Search

When the user asks about weather or local info, the search query is automatically enhanced:

```typescript
// User asks: "weather today"
// Search becomes: "weather today in San Francisco, United States"
```

This keeps latency and cost under control while improving reliability for time-sensitive queries.

---

## Vision Support and Multimodal Input

Image upload enables visual reasoning. Images are processed and passed to multimodal models along with textual instructions.

### Graceful Fallback

The important design choice here is **graceful fallback**. If vision processing fails or is unavailable, the system informs the user rather than hallucinating.

```typescript
try {
  // Process with vision model
  for await (const chunk of streamChatWithVision(messages)) {
    yield chunk;
  }
} catch (error) {
  // Fallback: inform user, don't hallucinate
  yield "I couldn't process the image. Could you describe what you'd like help with?";
}
```

Multimodal features are powerful, but they must be wrapped in strong guardrails to maintain trust.

---

## Data Layer and Reliability

At the storage layer, conversations, summaries, and metadata are separated:

```sql
-- Raw messages are append-only
TABLE messages
  id, session_id, role, content, created_at

-- Summaries are versioned
TABLE conversation_summaries
  id, session_id, summary_type, message_range_start,
  message_range_end, summary_text, token_count, created_at

-- Sessions track metadata
TABLE sessions
  id, user_id, title, created_at, updated_at
```

### Why This Structure?

- **Append-only messages** - Never lose history, easy to replay
- **Versioned summaries** - Can regenerate with new prompts
- **Separation** - Allows reprocessing and experimentation without corrupting history

Background jobs handle summarization and cleanup. Retries and timeouts are built in. The system assumes that external APIs can fail and designs around it.

---

## User Approval and Push Notifications

For a private chat system, user access needs to be controlled. New signups require admin approval before gaining full access. The challenge: how do you get notified instantly when someone signs up?

### The Problem with Third-Party Services

Initially, Slack webhooks seemed like the obvious choice. But rate limits quickly became a problem:

```
HTTP 429 Too Many Requests
"You are sending too many requests. Please relax."
```

Third-party notification services introduce dependencies that can fail or throttle at inconvenient times.

### Self-Hosted Solution: Gotify

**Gotify** is a self-hosted push notification server. It runs as a lightweight container in the same Kubernetes cluster:

```
User Signup → Chat App → Gotify Server → Mobile Push + Web UI
                              ↓
                    Admin clicks approve link
                              ↓
                    Chat App /api/admin/approve
```

### Why Gotify Works

| Benefit | Description |
|---------|-------------|
| **No rate limits** | Self-hosted means unlimited notifications |
| **Mobile push** | Android app receives instant alerts |
| **Web dashboard** | View and manage notifications in browser |
| **Simple API** | Single HTTP POST to send messages |
| **Lightweight** | ~50MB container, minimal resources |

### Implementation

Notifications are sent with markdown formatting for clean, actionable messages:

```typescript
const message = {
  title: "🔔 New User Signup",
  message: `**Email:** ${email}
**Name:** ${name || "Not provided"}
**Time:** ${createdAt.toLocaleString()}

---

[✅ **APPROVE**](${approveUrl})

[❌ **DECLINE**](${declineUrl})`,
  priority: 8,
  extras: {
    "client::display": { contentType: "text/markdown" }
  }
};

await fetch(`${GOTIFY_URL}/message?token=${token}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(message),
});
```

The admin receives a push notification, taps it, and the user is approved—all within seconds.

### Infrastructure Integration

Gotify runs alongside the chat app in Kubernetes:

```yaml
# gotify-deployment.yaml
containers:
- name: gotify
  image: gotify/server:latest
  ports:
  - containerPort: 80
  volumeMounts:
  - name: gotify-data
    mountPath: /app/data  # Persistent storage for messages
```

The chat app references Gotify via internal service DNS:

```yaml
- name: GOTIFY_URL
  value: "http://gotify-service:80"
- name: GOTIFY_TOKEN
  valueFrom:
    secretKeyRef:
      name: gotify-secret
      key: app-token
```

This keeps notification traffic internal to the cluster—fast and free.

---

## Why This Architecture

Every major decision ties back to **scalability**, **cost control**, and **user experience**:

| Decision | Purpose |
|----------|---------|
| Summarization | Controls token growth for long conversations |
| Structured rendering | Improves clarity and perceived quality |
| Tool-based augmentation | Enables capabilities without bloating every request |
| Self-hosted notifications | Eliminates rate limits and external dependencies |
| Separation of concerns | The data model enables iteration and evolution |

The system is designed to evolve. Prompts can change. Models can be swapped. Summaries can be regenerated. The architecture supports this flexibility.

---

## What This Enables Next

With these foundations, it becomes easier to add:

- **Personalization** - User preferences and style matching
- **Long-term memory** - Facts that persist across sessions
- **Domain-specific tools** - Calculator, code execution, APIs

The system is not a demo—it's a **platform for continuous improvement**.

---

## Final Thoughts

Building AI products is less about a single model and more about the **system around it**. Memory, retrieval, formatting, and orchestration are where product quality is won or lost.

If you're building in this space, focus on **lifecycle and architecture** as much as on model quality. That's where real differentiation emerges.

---

*Want to try it? Check out [chat.sudharsana.dev](https://chat.sudharsana.dev)*
