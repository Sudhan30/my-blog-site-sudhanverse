---
title: "Teaching My Chat App to Query Databases — A Text-to-SQL Agent"
date: 2026-03-11
tags: [ai, llm, agent, sql, typescript, architecture]
excerpt: "How I built a local text-to-SQL agent using Ollama tool calling and Gemma3, replacing the tedious SSH-psql-query workflow with natural language questions in a chat interface."
slug: text-to-sql-agent
readTime: 7
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
| **Local Ollama + Gemma3** | Free, private, already running in my cluster. No external dependency. Data never leaves the server |

The choice was obvious. Ollama already powers my chat system. Gemma3 12B supports tool calling natively. The infrastructure cost is zero — it is already running.

---

## Architecture

The architecture is a loop between the chat app and Ollama, with a safety layer between Ollama and the databases.

![Data Agent Architecture](/assets/images/data-agent-architecture.svg?v=1)

Here is the flow:

1. **User asks a question** in the chat UI — "How many comments did my blog get this week?"
2. **Chat App** (Bun/Hono) builds a system prompt that includes the database schemas, SQL examples, and tool definitions
3. **Request goes to Ollama** (Gemma3 12B) with tool definitions describing the available database query functions
4. **Gemma3 decides**: is this a regular chat message, or does it need to call a tool?
5. If tool call: the SQL goes through a **validation layer** (safety checks)
6. Validated query executes against the appropriate database via a **read-only connection**
7. Results flow back to Gemma3 as tool response context
8. Gemma3 generates a **natural language answer** from the raw query results
9. Answer streams back to the user via **SSE**

The key insight is that Ollama's tool calling follows the same pattern as OpenAI's function calling. You define tools as JSON schemas, and the model decides when to use them. The difference is that it runs locally, for free.

---

## Schema Context: Teaching the Model Your Database

The model needs to know what tables exist and what columns they have. This context is injected into the system prompt:

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

## Tool Definitions

Tools are defined in the Ollama-compatible format — identical to OpenAI's function calling schema:

```typescript
export const DATA_AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "query_blog_db",
      description:
        "Execute a read-only SQL query against the blog database. " +
        "Contains tables: comments, likes, comment_summaries.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "A SELECT SQL query to run against the blog database",
          },
        },
        required: ["sql"],
      },
    },
  },
  // ... similar definition for the second database
];
```

When the user asks "how many likes this week?", Gemma3 responds with a tool call instead of text. The tool call contains the function name and the SQL argument. The chat app intercepts this, executes the query, and feeds the result back.

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

## The Tool Call Loop

The most interesting part of the implementation is the tool call loop. The chat app makes a non-streaming request to Ollama with tool definitions. If the model responds with tool calls, the app executes them and feeds the results back. This can happen multiple times — up to three rounds — before the model gives a final natural language answer:

```typescript
export async function* chatWithTools(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  const MAX_TOOL_ROUNDS = 3;
  let currentMessages = [...messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      body: JSON.stringify({
        model,
        messages: currentMessages,
        tools: DATA_AGENT_TOOLS,
        stream: false,
      }),
    });

    const data = await response.json();

    if (data.message?.tool_calls?.length > 0) {
      // Execute each tool call
      for (const toolCall of data.message.tool_calls) {
        yield { type: "status", content: `Querying database...` };

        const result = await handleToolCall(
          toolCall.function.name,
          toolCall.function.arguments
        );

        // Feed result back to model
        currentMessages.push({
          role: "tool",
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
        });
      }
      continue; // Model may need another round
    }

    // No tool calls — stream the final answer
    yield { type: "text", content: data.message.content };
    return;
  }
}
```

The async generator pattern (`AgentStreamEvent`) lets the frontend show status updates like "Querying database..." while the tool call is in progress, then stream the final answer naturally.

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

## Lessons Learned

**Schema context matters more than model size.** Gemma3 12B writes accurate SQL not because it is a massive model, but because the system prompt gives it exact table schemas and SQL examples. A smaller model with good context beats a larger model guessing at column names.

**Tool calling works surprisingly well locally.** I expected Ollama's tool calling to be flaky compared to cloud APIs. It has been reliable. Gemma3 correctly identifies when to call tools versus when to just respond conversationally.

**The read-only constraint is freeing.** Once you know the worst case is a slow SELECT query that times out, the anxiety about LLM-generated SQL disappears. Defense in depth means no single failure is catastrophic.

**Few-shot SQL examples are essential.** Without them, the model would sometimes use incorrect date functions or miss `::date` casts. Three or four examples per query pattern eliminated almost all syntax errors.

---

## What's Next

This is version one. The foundation is solid, but there are clear extensions:

- **Caching frequent queries** — "How many comments today?" does not need to hit the database every time someone asks
- **Scheduled digests** — The agent could generate a daily summary and push it via Gotify: "Yesterday: 15 comments, 42 likes, 3 new posts"
- **More tools** — Beyond databases, the agent could check pod health, query Prometheus metrics, or trigger operational tasks

The broader takeaway is that local LLMs have crossed the threshold of practical utility for developer tooling. Gemma3 running on Ollama, on hardware I already own, is capable enough to replace a class of manual workflows that I used to do by hand. No API keys. No token costs. No data leaving my network.

The best tools are the ones you build because you got tired of doing something the hard way.

---

*Want to try it? Check out [chat.sudharsana.dev](https://chat.sudharsana.dev)*
