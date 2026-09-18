# Flowdeck demo: technical overview

How the demo in this folder works underneath, in full. It covers the knowledge base and how it
was prepared, the database, the AI agent, the chat memory, and the lead scoring and routing.

Flowdeck is a fictional product invented for this demo. Everything below describes what was
built for it. Both n8n flows described here, the agent chain and the lead chain, are exported together in
[`../generic/workflow/ampersand-workflow.json`](../generic/workflow/ampersand-workflow.json).
The Python script used to prepare the knowledge base is not part of this repository.

**Contents**

1. [Knowledge base and chunking](#1-knowledge-base-and-chunking)
2. [Assembly and embedding](#2-assembly-and-embedding)
3. [Supabase schema](#3-supabase-schema)
4. [AI agent workflow](#4-ai-agent-workflow)
5. [Chat memory](#5-chat-memory)
6. [Lead scoring and routing workflow](#6-lead-scoring-and-routing-workflow)

---

## 1. Knowledge base and chunking

The knowledge base is a single markdown file,
[`knowledge/flowdeck-knowledge-base.md`](knowledge/flowdeck-knowledge-base.md). It has five
sections: Company, Product, Pricing, Differentiation, and Frequently asked.

It was chunked with a custom Python ingestion script:

- Each chunk targets roughly 400 characters.
- Every pair of immediately adjacent chunks shares an overlap of roughly 80 characters.
- Chunk boundaries respect sentence and paragraph structure, and no chunk starts or ends
  mid-word.
- Headers stay attached to the content that follows them where practical.

The overlap exists so that a fact spanning a paragraph or section boundary is not severed
between two chunks. Both chunks carry enough shared context to remain useful for retrieval on
their own.

---

## 2. Assembly and embedding

Each chunk is embedded with Google's Gemini embedding model, `gemini-embedding-001`, configured
to output 3072-dimensional vectors. That is the model's native output size, and there is no way
to force a smaller dimensionality through the tooling used.

Each chunk is then inserted into a Supabase table together with its embedding, its source
filename and its chunk index.

---

## 3. Supabase schema

Three tables exist.

### `documents`

Stores the knowledge base chunks.

| Column | Type | Holds |
|---|---|---|
| `id` | uuid | Row identifier |
| `content` | text | The chunk itself |
| `embedding` | vector, 3072 dimensions | The chunk's embedding |
| `source_file` | text | The file the chunk came from |
| `chunk_index` | int | The chunk's position in that file |
| `created_at` | timestamptz | When the row was created |

A Postgres function, `match_documents`, performs cosine similarity search against this table.
It accepts a query embedding, a match count (default 4), and an optional filter parameter. The
filter is required by the call signature of the n8n Supabase Vector Store node. It is unused in
this build, because there is no per-chunk metadata to filter on.

### `chat_messages`

Stores the AI agent's conversation history. Its shape is dictated by n8n's Postgres Chat Memory
node, which expects exactly this structure rather than a custom schema.

| Column | Type | Holds |
|---|---|---|
| `id` | serial | Row identifier |
| `session_id` | text | The visitor's session |
| `message` | jsonb | One conversation turn, stored as a JSON object |

### `leads`

Stores every contact form submission.

| Column | Holds |
|---|---|
| `id` | Row identifier (uuid) |
| `created_at` | When the submission arrived |
| `name` | From the form |
| `email` | From the form |
| `company` | From the form |
| `warehouse_count` | From the form |
| `order_volume` | From the form |
| `current_tooling` | From the form |
| `timeline` | From the form |
| `score` | Computed by the workflow (int) |
| `intent` | `high` or `low`, computed by the workflow (text) |
| `assigned_owner` | Set only for routed high-intent leads (text, nullable) |
| `email_sent` | Set to true once the owner notification is sent (boolean) |
| `status` | The lead's status (text) |


---

## 4. AI agent workflow

Front end code: [`src/components/AgentContext.tsx`](src/components/AgentContext.tsx) and
[`src/lib/api.ts`](src/lib/api.ts). Workflow nodes: those named `Ampersand - Agent Webhook`,
`RAG Agent`, `Anthropic`, `Chat Memory`, `Vector Store`, `Embeddings Google Gemini` and
`Agent Response`.

1. A **webhook** receives an incoming message and a `session_id`.
2. An **AI Agent** node, using Claude through the Anthropic Chat Model, handles it. Three
   things are attached to the agent:
   - **Chat Model:** Anthropic.
   - **Memory:** Postgres Chat Memory, reading and writing the `chat_messages` table keyed by
     `session_id`.
   - **Tool:** a Supabase Vector Store node in "retrieve as tool" mode, backed by an Embeddings
     Google Gemini node using the same `gemini-embedding-001` model, querying the `documents`
     table through `match_documents`.
3. The response goes back to the front end as `{ "reply": "..." }`.

The agent's system prompt instructs it to:

- answer only from the knowledge base tool;
- never state a specific price or dollar figure;
- describe the four pricing tiers only in terms of their warehouse and order volume
  thresholds, as the knowledge base states them;
- always defer exact pricing to the contact form;
- proactively suggest the form when it detects buying signals, such as a stated warehouse
  count, a timeline, or dissatisfaction with spreadsheets.

---

## 5. Chat memory

Each visitor session generates one `session_id`, a UUID, on the client, in memory only, when
the chat widget mounts. It is not persisted in `localStorage`, so a page reload starts a fresh
conversation.

Every message in a session is logged to `chat_messages`. The Postgres Chat Memory node replays
the prior turns into the model's context on each new message. That is what lets the agent
resolve a follow-up such as "does that apply to smaller operators too" back to what was
discussed earlier in the same session, without the front end resending earlier messages.

---

## 6. Lead scoring and routing workflow

Front end code: [`src/components/QuoteForm.tsx`](src/components/QuoteForm.tsx) and
[`src/lib/tier.ts`](src/lib/tier.ts). Workflow nodes: those named `Ampersand - Lead Webhook`,
`Score Lead`, `Insert Lead`, `Check Intent`, `Route by Warehouse Count`, the four
`Notify Owner` and `Update Lead` nodes, and `Lead Response`.

### Steps

1. A **webhook** receives the form submission: `name`, `email`, `company`, `warehouse_count`,
   `order_volume`, `current_tooling` and `timeline`.
2. A **Code node** computes a score by summing weighted values across four fields (table
   below). A total of 12 or higher is classified as high intent, anything below 12 as low
   intent.
3. Every submission, whatever its score, is **inserted into the `leads` table** straight after
   scoring.
4. An **IF node** checks the intent.
   - **Low intent** skips directly to the response node. No email is sent and there is no
     further processing.
   - **High intent** continues to a **Switch node**, which routes by `warehouse_count` into one
     of four branches (below).
5. Each branch sends a **notification email** with the lead's details, then **updates that
   lead's row** in Supabase, setting `assigned_owner` and setting `email_sent` to true.
6. The **response node** answers every submission, high or low intent, with the same generic
   confirmation. Score, intent and routing are never exposed to the visitor or to the front
   end.

### Scoring weights

| Field | Value | Points |
|---|---|---|
| `warehouse_count` | `1` | 1 |
| | `2-5` | 3 |
| | `6-10` | 5 |
| | `10+` | 6 |
| `order_volume` | `Under 500` | 1 |
| | `500 to 5000` | 3 |
| | `5000 to 20000` | 5 |
| | `20000+` | 6 |
| `current_tooling` | `Spreadsheets or manual` | 4 |
| | `Nothing` | 2 |
| | `Another platform` | 1 |
| `timeline` | `This month` | 4 |
| | `This quarter` | 2 |
| | `Just exploring` | 0 |

The highest possible score is 20.

### Routing

| `warehouse_count` | Owner |
|---|---|
| `1` | Owner A |
| `2-5` | Owner B |
| `6-10` | Owner C |
| `10+` | Owner D |

The values in the scoring table are matched exactly, including capitalisation and spacing. A
value that does not match scores 0 for that field.
