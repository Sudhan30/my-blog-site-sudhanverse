---
title: "Teaching My Chat App to Query Databases — A Dual-Model Text-to-SQL Agent"
date: 2026-03-11
category: engineering
tags: [ai, llm, agent, sql, typescript, architecture, ollama]
excerpt: "How I built a local text-to-SQL agent using two specialized models — Gemma3 for conversation and Qwen3 for tool calling — replacing the tedious SSH-psql-query workflow with natural language questions. Everything runs locally, nothing leaves my server."
slug: text-to-sql-agent
readTime: 9
cover: /assets/images/data-agent-architecture.svg
badge: "AI Agents & SQL"
highlights:
  - "Dual-Model Routing"
  - "Read-Only SQL Boundary"
  - "100% Local GPU Inference"
---

> "Laziness is the mother of invention."

There is a certain kind of developer laziness that is not about avoiding work, but about refusing to do the same boring thing for the hundredth time. For me, that boring thing was checking simple database metrics.

How many comments did my blog get today? How many likes this week? What does the latest data in my operational database look like? Every time I needed an answer, the ritual was the same:

1. SSH into the server
2. `kubectl exec` into the database pod
3. Connect to psql
4. Write the SQL query from memory
5. Squint at the terminal output

Five steps to answer a question that should take five seconds. I finally got tired of it.

---

## The Idea

What if I could just ask my chat app a question in plain English, and it would query the database and tell me the answer? Not a fancy BI dashboard. Not a monitoring alert. Just a conversational interface where I type "how many comments today?" and get a number back.

This is a text-to-SQL agent. The LLM reads my question, decides which database to query, writes the SQL, executes it safely, and presents the results in natural language. All within the chat interface I already use every day.

---

## Why Not MCP, ADK, or Cloud APIs?

Before building anything, I evaluated the existing approaches. Each had a disqualifying trade-off for my use case.

| Approach | Why It Didn't Fit |
|----------|-------------------|
| **MCP (Model Context Protocol)** | Designed for IDE and desktop integrations. Great for Claude Desktop or VS Code, but adds protocol complexity that is overkill for a web app with a single backend |
| **ADK (Google Agent Development Kit)** | Python-based, tied to the Google ecosystem. My stack is Bun and TypeScript. Introducing a Python sidecar for a feature this simple felt wrong |
| **Claude/GPT API with function calling** | Works well, but costs money per query. Every "how many likes today?" would be an API call to an external service. External dependency, recurring cost, and my data leaves my network |
| **Local Ollama + open models** | Free, private, already running in my cluster. No external dependency. Data never leaves the server |

The choice was obvious. Ollama already powers my chat system. The infrastructure cost is zero — it is already running.

---

## Why Two Models?

Here is where it gets interesting. My first attempt used a single model — Gemma3 12B — for everything: understanding the question, generating SQL, and formatting the answer. It worked, but the approach had a fundamental tension.

**Gemma3 12B** is an excellent conversational model. It understands context, nuance, and generates natural, well-formatted responses. But when asked to simultaneously handle tool calling — deciding when to use a tool, generating precise SQL syntax, and structuring the output in a machine-parseable format — it struggled. It does not support Ollama's native tool calling API at all, and prompt-based workarounds were unreliable.

**Qwen3 8B** is the opposite. It is a model built with structured output and code generation as first-class capabilities. It natively supports Ollama's tool calling API, meaning it returns proper JSON function calls instead of free text that needs parsing. For SQL generation specifically, Qwen3 is remarkably precise — it respects schema definitions, uses correct date functions, and handles edge cases in query syntax.

The insight was simple: **use each model for what it is best at**.

| Capability | Gemma3 12B | Qwen3 8B |
|-----------|-----------|---------|
| Natural conversation | Excellent | Adequate but stiff |
| Understanding user intent | Excellent | Good |
| Native tool calling | Not supported | Native support |
| SQL generation | Decent | Excellent |
| Formatting results as markdown | Excellent | Adequate |
| Structured JSON output | Unreliable | Precise |

Instead of fighting one model's weaknesses, I paired two models that complement each other. Gemma3 handles the parts that need human-like understanding — figuring out what the user wants and presenting results naturally. Qwen3 handles the parts that need machine precision — generating the exact right SQL query and tool call.

---

## Architecture

The architecture is a pipeline between two models with a safety layer guarding the databases.

![Dual-Model Agent Architecture](/assets/images/data-agent-architecture.svg?v=2)

Here is the flow:

1. **User asks a question** in the chat UI — "How many comments did my blog get this week?"
2. **Gemma3 12B** receives the question and determines intent. Is this a regular conversation, or does it need data?
3. If data is needed, Gemma3 emits a structured **intent tag** — a description of what data is needed and which tool to use
4. The chat app passes this intent to **Qwen3 8B** along with the full database schema context
5. **Qwen3 generates a precise tool call** using native Ollama function calling — the SQL query, properly structured
6. The SQL passes through the **safety layer** (validation, read-only user, timeouts)
7. Query results flow back through the chat app
8. **Gemma3 12B** receives the raw results and formats them into a **natural language answer** with markdown
9. Answer streams back to the user via **SSE**

The key design decision is that Gemma3 never sees the full database schema. It only knows tool names and one-line descriptions — enough to detect intent, not enough to bloat its context window. Qwen3 gets the full schema and SQL examples, but never needs conversation history. Each model operates with a focused, minimal context.

---

## Intent Detection: How Gemma3 Decides

Gemma3's system prompt includes lightweight tool awareness. When it determines that the user's question requires data retrieval, it responds with a structured tag instead of a conversational answer:

```typescript
// Gemma3 system prompt (simplified)
`When the user's question needs data, respond with ONLY:
<intent>{"needs_tool": true, "tool_hint": "query_blog_db",
  "description": "Count of blog comments created today"}</intent>`
```

If no intent tag is found in the response, the chat app treats it as a normal conversation and streams the response directly. No tool calling overhead for regular chat. This means asking "tell me a joke" goes through a single model call — no performance penalty for non-data questions.

The parsing is straightforward:

```typescript
function parseIntent(text: string): IntentResult | null {
  const match = text.match(/<intent>\s*(\{[\s\S]*?\})\s*<\/intent>/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (typeof parsed.needs_tool === "boolean" && parsed.description) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
```

---

## Tool Calling: How Qwen3 Generates SQL

Once Gemma3 identifies the intent, Qwen3 takes over. It receives the intent description and the full database schema via Ollama's native tool calling API:

```typescript
const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
  method: "POST",
  body: JSON.stringify({
    model: "qwen3:8b",
    messages: [
      { role: "system", content: schemaContext + sqlExamples },
      { role: "user", content: intent.description },
    ],
    tools: DATA_AGENT_TOOLS,  // Native Ollama tool calling
    stream: false,
    options: { temperature: 0, num_ctx: 4096 },
  }),
});

// Qwen3 returns structured tool calls — not free text
const toolCalls = data.message?.tool_calls;
if (toolCalls?.length > 0) {
  const tc = toolCalls[0];
  return {
    name: tc.function.name,        // "query_blog_db"
    arguments: tc.function.arguments // { sql: "SELECT COUNT(*)..." }
  };
}
```

Notice `temperature: 0`. For SQL generation, you want deterministic output. The same question should always produce the same query. Qwen3 at zero temperature with the schema context is remarkably accurate — it gets date functions, aggregations, and JOIN conditions right on the first try.

If a query fails at the database level (syntax error, missing column), the system retries once — sending the error message back to Qwen3 so it can fix the query. One retry, not an infinite loop.

---

## Schema Context: Teaching the Model Your Database

Qwen3 needs to know what tables exist and what columns they have. This context is part of its system prompt:

```typescript
export const SCHEMA_CONTEXT = `
## Available Databases

### BLOG_DB
Tables:
- comments(id, post_id, content, author_name, author_email, created_at, approved, client_id)
- likes(id, post_id, client_id, ip_hash, created_at)
- comment_summaries(id, post_id, summary_text, comment_count, last_comment_id, updated_at)
`;
```

I also include SQL examples as few-shot hints. This dramatically improves query accuracy, especially for date filtering patterns and aggregation:

```typescript
export const SQL_EXAMPLES = `
SQL EXAMPLES:
- Blog comments today: SELECT COUNT(*) FROM comments WHERE created_at::date = CURRENT_DATE
- Total blog likes: SELECT COUNT(*) FROM likes
- Comments per post: SELECT post_id, COUNT(*) as comment_count FROM comments
    WHERE approved = true GROUP BY post_id ORDER BY comment_count DESC LIMIT 10
`;
```

A second database with business metrics is also available to the agent. The schema context includes both databases so the model can route queries to the correct one based on the question.

---

## The Safety Layer

Giving an LLM direct database access sounds dangerous. It does not have to be. The safety layer has three components:

### 1. Read-Only Database User

The agent connects with a dedicated read-only PostgreSQL user. Even if the model hallucinates a `DROP TABLE`, the database user lacks the permissions to execute it:

```typescript
const BLOG_DB_URL =
  process.env.BLOG_DB_READONLY_URL ||
  "postgresql://readonly_agent:****@postgres-service:5432/blog_db";
```

### 2. SQL Validation

Before any query reaches the database, it passes through a validation function:

```typescript
export function validateSQL(sql: string): { valid: boolean; error?: string } {
  const trimmed = sql.trim().replace(/;+$/, "");

  // Must be a SELECT or WITH (CTE)
  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    return { valid: false, error: "Only SELECT queries are allowed" };
  }

  // Block dangerous keywords
  const forbidden =
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|COPY|EXECUTE|DO\s*\$)\b/i;
  if (forbidden.test(trimmed)) {
    return { valid: false, error: "Query contains forbidden operations" };
  }

  return { valid: true };
}
```

### 3. Query Limits

Every query that lacks a `LIMIT` clause gets one automatically appended. Connection timeouts are set to 5 seconds. The connection pool is capped at 5 connections. If anything goes wrong, the query fails fast instead of hanging:

```typescript
const db = postgres(DB_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 5,
});

// Auto-limit unbounded queries
if (!/\bLIMIT\b/i.test(query)) {
  query += " LIMIT 100";
}
```

Defense in depth. Each layer catches what the previous one might miss.

---

## The Dual-Model Loop

The most interesting part of the implementation is how the two models coordinate. The chat app orchestrates the entire flow as an async generator:

```typescript
export async function* chatWithTools(
  messages: ChatMessage[],
  options: ChatOptions = {},
  locationContext?: { city?: string; country?: string }
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  // Step 1: Gemma3 — understand intent
  const response = await chat(messages, { model: CHAT_MODEL });
  const intent = parseIntent(response);

  if (!intent || !intent.needs_tool) {
    // Direct conversation — no tool needed
    yield { type: "text", content: response };
    return;
  }

  // Step 2: Qwen3 — generate precise tool call
  yield { type: "status", content: "Thinking..." };
  const toolCall = await callToolModel(intent, locationContext);

  // Step 3: Execute the tool through safety layer
  yield { type: "status", content: "Querying database..." };
  const result = await handleToolCall(toolCall.name, toolCall.arguments);

  // Step 4: Gemma3 — format results as natural language
  const formattingMessages = [
    ...messages,
    { role: "user", content: `Results:\n${JSON.stringify(result.data)}\n\nPresent clearly.` },
  ];
  const formatted = await chat(formattingMessages, { model: CHAT_MODEL });
  yield { type: "text", content: formatted };
}
```

For a normal conversation, this is a single model call. For a data question, it is three calls: Gemma3 (intent) → Qwen3 (SQL) → Gemma3 (formatting). On my hardware, the total round-trip for a data question is around 4-6 seconds — both models stay loaded in memory via Ollama's `keep_alive`, so there is no cold start penalty.

---

## What It Feels Like

Before the agent:

```
local$ ssh suddu-server
server$ kubectl exec -it postgres-pod -- psql -U blog blog_db
blog_db=# SELECT COUNT(*) FROM comments WHERE created_at::date = CURRENT_DATE;
 count
-------
    12
(1 row)
blog_db=# \q
server$ exit
```

After the agent:

```
Me: How many comments did the blog get today?
Agent: Your blog received 12 comments today.
```

Same answer. Five steps collapsed into one sentence. Multiply that by every ad-hoc question I ask throughout the week, and the time savings add up fast.

The agent also handles more complex questions naturally. "Which posts have the most comments?" or "Show me the trend of likes over the past month" — queries I would have to think about and type carefully in psql. The model writes the SQL, handles the aggregation, and presents a clean summary.

---

## The Privacy Argument

Here is what I care about most: **none of this leaves my server**.

Every token generated by Gemma3 and Qwen3 is processed locally on my AMD UM790 mini PC. No API calls to OpenAI or Google or Anthropic. No data sent to any external service. My database queries, my results, my conversations — all contained within hardware I physically own.

This is not just a philosophical preference. For a system that queries production databases, privacy is a hard requirement. I would never send raw SQL results through a third-party API. With local models, I do not have to make that trade-off. I get the full capability of LLM-powered tooling without any of the data exposure.

The cost? Zero per query. The models run on hardware I already paid for. Compare that to cloud API pricing where every "how many comments today?" would cost a fraction of a cent — small individually, but it adds up, and the real cost is the dependency itself.

---

## The SLM Future

There is a bigger picture here. What I have built is a concrete example of **small language model composition** — using multiple specialized SLMs together instead of one massive general-purpose model.

Today it is Gemma3 + Qwen3. Tomorrow it could be:
- A **reasoning model** for complex multi-step questions
- A **code model** for generating not just SQL but API calls, scripts, or config changes
- A **vision model** for analyzing charts and dashboards
- A **summarization model** optimized for condensing large result sets

The pattern is the same: detect intent with one model, execute with a specialist, format with another. Each model can be swapped independently as better options emerge. When Qwen4 ships with improved SQL generation, I swap one model and everything else stays the same.

This is the direction the industry is heading. Not everyone needs a 400B parameter model for every task. A 12B model that understands what you are asking, paired with an 8B model that executes precisely, can outperform a single larger model at a fraction of the resource cost — and run entirely on consumer hardware.

The open model ecosystem makes this possible. Gemma from Google, Qwen from Alibaba, Llama from Meta — all freely available, all runnable locally through Ollama. We are at the point where a single developer with a mini PC can build AI-powered tools that rival what required cloud infrastructure and API budgets a year ago.

---

## Lessons Learned

**Schema context matters more than model size.** Qwen3 8B writes accurate SQL not because it is a massive model, but because the system prompt gives it exact table schemas and SQL examples. A smaller model with good context beats a larger model guessing at column names.

**Use each model for its strengths.** Fighting Gemma3 to produce structured JSON tool calls was a losing battle. Handing that job to Qwen3 — a model built for it — solved the problem immediately. Not every model needs to do everything.

**The read-only constraint is freeing.** Once you know the worst case is a slow SELECT query that times out, the anxiety about LLM-generated SQL disappears. Defense in depth means no single failure is catastrophic.

**Few-shot SQL examples are essential.** Without them, the model would sometimes use incorrect date functions or miss `::date` casts. Three or four examples per query pattern eliminated almost all syntax errors.

**Local models have crossed the practical utility threshold.** Both Gemma3 12B and Qwen3 8B fit comfortably in 64GB RAM alongside a full K3s cluster. The performance is good enough for interactive use. The quality is good enough for production.

---

## What's Next

This is version one. The foundation is solid, but there are clear extensions:

- **Caching frequent queries** — "How many comments today?" does not need to hit the database every time someone asks
- **Scheduled digests** — The agent could generate a daily summary and push it via Gotify: "Yesterday: 15 comments, 42 likes, 3 new posts"
- **More tools** — Beyond databases, the agent could check pod health, query Prometheus metrics, or trigger operational tasks
- **More specialist models** — A dedicated reasoning model for complex analytical questions, or a vision model for chart analysis

The broader takeaway is that we are entering an era where AI-powered developer tools do not require cloud APIs, vendor lock-in, or recurring costs. Two open models running on Ollama, on hardware I already own, are capable enough to replace a class of manual workflows I used to do by hand. No API keys. No token costs. No data leaving my network.

The best tools are the ones you build because you got tired of doing something the hard way.

---

*Want to try it? Check out [chat.sudharsana.dev](https://chat.sudharsana.dev)*
