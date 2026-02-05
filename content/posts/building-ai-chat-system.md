---
title: "Building an AI Chat System with Practical Memory, Search, and Multimodal Intelligence"
date: 2026-02-05
tags: [ai, llm, architecture, backend, typescript]
excerpt: "A behind-the-scenes engineering deep dive into building a production AI chat system. Memory management, context compression, web search integration, and the infrastructure decisions that make it work."
slug: building-ai-chat-system
---

# Building an AI Chat System with Practical Memory, Search, and Multimodal Intelligence

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

<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin: 24px 0;">
<svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; font-family: system-ui, -apple-system, sans-serif;">
  <defs>
    <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
    <linearGradient id="apiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
    <linearGradient id="llmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
    <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#db2777"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background grid -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/>
  </pattern>
  <rect width="800" height="520" fill="url(#grid)"/>

  <!-- Title -->
  <text x="400" y="35" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="600">Chat System Data Flow</text>

  <!-- User/Browser Box -->
  <g filter="url(#shadow)">
    <rect x="30" y="70" width="140" height="80" rx="12" fill="url(#userGrad)"/>
    <text x="100" y="105" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">User Browser</text>
    <text x="100" y="125" text-anchor="middle" fill="#e0e7ff" font-size="10">Message + Location</text>
    <text x="100" y="140" text-anchor="middle" fill="#e0e7ff" font-size="10">+ Images</text>
  </g>

  <!-- API Server Box -->
  <g filter="url(#shadow)">
    <rect x="250" y="60" width="160" height="100" rx="12" fill="url(#apiGrad)"/>
    <text x="330" y="95" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">Hono API Server</text>
    <text x="330" y="115" text-anchor="middle" fill="#e0e0ff" font-size="10">Auth Middleware</text>
    <text x="330" y="130" text-anchor="middle" fill="#e0e0ff" font-size="10">SSE Streaming</text>
    <text x="330" y="145" text-anchor="middle" fill="#e0e0ff" font-size="10">Context Builder</text>
  </g>

  <!-- Arrow: User to API -->
  <path d="M 170 110 L 240 110" stroke="#60a5fa" stroke-width="2" fill="none" marker-end="url(#arrowBlue)"/>
  <defs><marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa"/></marker></defs>

  <!-- Context Manager Box -->
  <g filter="url(#shadow)">
    <rect x="490" y="60" width="160" height="100" rx="12" fill="#374151"/>
    <text x="570" y="95" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">Context Manager</text>
    <text x="570" y="115" text-anchor="middle" fill="#9ca3af" font-size="10">Recent Messages</text>
    <text x="570" y="130" text-anchor="middle" fill="#9ca3af" font-size="10">+ Summaries</text>
    <text x="570" y="145" text-anchor="middle" fill="#9ca3af" font-size="10">+ System Prompt</text>
  </g>

  <!-- Arrow: API to Context -->
  <path d="M 410 110 L 480 110" stroke="#a78bfa" stroke-width="2" fill="none" marker-end="url(#arrowPurple)"/>
  <defs><marker id="arrowPurple" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa"/></marker></defs>

  <!-- LLM Box -->
  <g filter="url(#shadow)">
    <rect x="680" y="70" width="100" height="80" rx="12" fill="url(#llmGrad)"/>
    <text x="730" y="105" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">Ollama</text>
    <text x="730" y="125" text-anchor="middle" fill="#fef3c7" font-size="10">Gemma 3</text>
    <text x="730" y="140" text-anchor="middle" fill="#fef3c7" font-size="10">12B Model</text>
  </g>

  <!-- Arrow: Context to LLM -->
  <path d="M 650 110 L 670 110" stroke="#fbbf24" stroke-width="2" fill="none" marker-end="url(#arrowYellow)"/>
  <defs><marker id="arrowYellow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24"/></marker></defs>

  <!-- Database Section -->
  <g filter="url(#shadow)">
    <rect x="180" y="220" width="200" height="140" rx="12" fill="url(#dbGrad)"/>
    <text x="280" y="250" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">PostgreSQL</text>

    <!-- Table icons -->
    <rect x="200" y="265" width="70" height="35" rx="4" fill="#065f46"/>
    <text x="235" y="280" text-anchor="middle" fill="#a7f3d0" font-size="9" font-weight="500">messages</text>
    <text x="235" y="293" text-anchor="middle" fill="#6ee7b7" font-size="8">append-only</text>

    <rect x="285" y="265" width="75" height="35" rx="4" fill="#065f46"/>
    <text x="322" y="280" text-anchor="middle" fill="#a7f3d0" font-size="9" font-weight="500">summaries</text>
    <text x="322" y="293" text-anchor="middle" fill="#6ee7b7" font-size="8">versioned</text>

    <rect x="200" y="310" width="70" height="35" rx="4" fill="#065f46"/>
    <text x="235" y="325" text-anchor="middle" fill="#a7f3d0" font-size="9" font-weight="500">sessions</text>
    <text x="235" y="338" text-anchor="middle" fill="#6ee7b7" font-size="8">metadata</text>

    <rect x="285" y="310" width="75" height="35" rx="4" fill="#065f46"/>
    <text x="322" y="325" text-anchor="middle" fill="#a7f3d0" font-size="9" font-weight="500">users</text>
    <text x="322" y="338" text-anchor="middle" fill="#6ee7b7" font-size="8">auth</text>
  </g>

  <!-- Arrow: API to Database -->
  <path d="M 330 160 L 330 180 L 280 180 L 280 210" stroke="#34d399" stroke-width="2" fill="none" marker-end="url(#arrowGreen)"/>
  <defs><marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#34d399"/></marker></defs>

  <!-- Web Search Box -->
  <g filter="url(#shadow)">
    <rect x="460" y="220" width="150" height="80" rx="12" fill="url(#searchGrad)"/>
    <text x="535" y="255" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">Brave Search</text>
    <text x="535" y="275" text-anchor="middle" fill="#fce7f3" font-size="10">Location-aware</text>
    <text x="535" y="290" text-anchor="middle" fill="#fce7f3" font-size="10">Real-time data</text>
  </g>

  <!-- Arrow: API to Search -->
  <path d="M 370 160 L 370 200 L 460 200 L 460 230 L 470 230" stroke="#f472b6" stroke-width="2" fill="none" marker-end="url(#arrowPink)"/>
  <defs><marker id="arrowPink" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#f472b6"/></marker></defs>
  <text x="410" y="195" text-anchor="middle" fill="#f472b6" font-size="9">if needed</text>

  <!-- Background Job Box -->
  <g filter="url(#shadow)">
    <rect x="460" y="340" width="150" height="70" rx="12" fill="#1f2937"/>
    <text x="535" y="370" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="600">Background Jobs</text>
    <text x="535" y="390" text-anchor="middle" fill="#9ca3af" font-size="10">Summarization</text>
    <text x="535" y="403" text-anchor="middle" fill="#9ca3af" font-size="10">async, non-blocking</text>
  </g>

  <!-- Arrow: Database to Background -->
  <path d="M 380 290 L 420 290 L 420 375 L 450 375" stroke="#6b7280" stroke-width="2" stroke-dasharray="5,5" fill="none" marker-end="url(#arrowGray)"/>
  <defs><marker id="arrowGray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/></marker></defs>

  <!-- Response flow back -->
  <path d="M 730 150 L 730 450 L 100 450 L 100 160" stroke="#60a5fa" stroke-width="2" stroke-dasharray="8,4" fill="none" marker-end="url(#arrowBlue)"/>
  <text x="400" y="470" text-anchor="middle" fill="#60a5fa" font-size="11" font-weight="500">SSE Stream Response</text>

  <!-- Legend -->
  <g transform="translate(30, 420)">
    <text x="0" y="0" fill="#9ca3af" font-size="10" font-weight="600">LEGEND:</text>
    <circle cx="10" cy="20" r="6" fill="url(#userGrad)"/>
    <text x="25" y="24" fill="#9ca3af" font-size="9">Client</text>
    <circle cx="80" cy="20" r="6" fill="url(#apiGrad)"/>
    <text x="95" y="24" fill="#9ca3af" font-size="9">Server</text>
    <circle cx="150" cy="20" r="6" fill="url(#dbGrad)"/>
    <text x="165" y="24" fill="#9ca3af" font-size="9">Storage</text>
    <circle cx="220" cy="20" r="6" fill="url(#llmGrad)"/>
    <text x="235" y="24" fill="#9ca3af" font-size="9">AI Model</text>
    <circle cx="300" cy="20" r="6" fill="url(#searchGrad)"/>
    <text x="315" y="24" fill="#9ca3af" font-size="9">External API</text>
  </g>
</svg>
</div>

The diagram shows how a user message flows through the system: from the browser through authentication, context assembly (pulling from database and optionally web search), to the LLM, and back via streaming. Background jobs handle summarization asynchronously to keep responses fast.

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

```
┌─────────────────┐   ┌──────────────────┐   ┌───────────────────┐
│  Recent Window  │ + │ Summary Snapshot │ + │ System Instructions│
│  (last 5-10 msgs)   │   (compressed past)   │   (personality/rules) │
└────────┬────────┘   └────────┬─────────┘   └─────────┬─────────┘
         │                     │                       │
         └─────────────────────┼───────────────────────┘
                               ▼
                    ┌──────────────────┐
                    │   Final Context   │
                    │  (sent to model)  │
                    └──────────────────┘
```

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

## Why This Architecture

Every major decision ties back to **scalability**, **cost control**, and **user experience**:

| Decision | Purpose |
|----------|---------|
| Summarization | Controls token growth for long conversations |
| Structured rendering | Improves clarity and perceived quality |
| Tool-based augmentation | Enables capabilities without bloating every request |
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
