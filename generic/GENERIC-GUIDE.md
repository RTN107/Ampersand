# Generic guide: the plain page and the workflow

Everything about the `generic/` folder in one place: how the plain HTML page works, how the n8n
workflow works, and how the two connect. For setup steps in order, see the
[main README](../README.md). This file is the reference for what each part does and what you can
change.

**Contents**

1. [What is in this folder](#1-what-is-in-this-folder)
2. [How the page and the workflow fit together](#2-how-the-page-and-the-workflow-fit-together)
3. [The plain page](#3-the-plain-page)
4. [The workflow](#4-the-workflow)
5. [Testing status](#5-testing-status)

---

## 1. What is in this folder

| File | What it is |
|---|---|
| [`website/index.html`](website/index.html) | One static HTML file: a chat box and a configurable contact form. Inline CSS, vanilla JavaScript, no dependencies, no build step |
| [`workflow/ampersand-workflow.json`](workflow/ampersand-workflow.json) | The n8n export: one workflow, named Ampersand, holding an agent chain and a lead chain |

The page sends two kinds of request. The workflow answers them. Neither needs the other to be
this exact pair: any front end that sends the requests in section 2 can use the workflow, and
any backend that answers them can serve the page.

---

## 2. How the page and the workflow fit together

Both endpoints are `POST` requests with a JSON body and `Content-Type: application/json`.

### Chat

The page sends:

```json
{ "message": "text the visitor typed", "session_id": "uuid string" }
```

The workflow answers with HTTP 2xx and:

```json
{ "reply": "text to display" }
```

`session_id` is generated once per page load with `crypto.randomUUID()` (with a fallback
generator) and held in memory only, so a reload starts a new conversation. The page sends only
the newest message. The workflow keeps the conversation, keyed by `session_id`, so the page
never resends earlier turns.

Anything else, meaning a non-2xx status, invalid JSON, a missing or non-string `reply`, a
network error or a timeout, shows a visible error message in the conversation.

### Lead capture

The page sends a flat object with one key per entry in `FORM_FIELDS`, keyed by that entry's
`id`. With the default fields:

```json
{ "name": "string", "email": "string", "message": "string" }
```

The workflow answers with HTTP 2xx and:

```json
{ "success": true, "message": "text to display" }
```

`success: true` shows `message` in a success banner and resets the form. `success: false` shows
`message` in an error banner and keeps what was typed. A non-2xx status, invalid JSON, or a
response where `success` is not a boolean or `message` is not a string shows the generic
`TEXT.leadError` message.

### Which page field feeds which node

The workflow reads specific keys from the lead request. A key it does not read is ignored, and
a key it needs that is missing is treated as empty.

| Form field `id` | Read by | Used for |
|---|---|---|
| `name` | Insert Lead, Notify Owner | Saved to `leads`, shown in the notification email |
| `email` | Insert Lead, Notify Owner | Saved to `leads`, shown in the notification email |
| `company` | Insert Lead, Notify Owner | Saved to `leads`, shown in the email and its subject |
| `warehouse_count` | Score Lead, Route by Warehouse Count, Insert Lead, Notify Owner | Adds to the score, picks the owner branch, saved, shown |
| `order_volume` | Score Lead, Insert Lead, Notify Owner | Adds to the score, saved, shown |
| `current_tooling` | Score Lead, Insert Lead, Notify Owner | Adds to the score, saved, shown |
| `timeline` | Score Lead, Insert Lead, Notify Owner | Adds to the score, saved, shown |

The page's default fields are `name`, `email` and `message`. `message` is not read by any node,
so it is not saved. With only the defaults, `company` and the four scored fields are missing, so
every lead scores 0 and none is emailed. To make the workflow score, give the page the seven
fields above, with each `id` and each option written exactly as the workflow matches it. A
ready-made array is in
[section 5.1 of the main README](../README.md#51-the-form-fields).

### CORS

The page is a static file that calls the webhooks from the browser, so the workflow's webhooks
must allow cross-origin `POST` requests with a JSON content type, including the preflight
`OPTIONS` request. This is the most likely cause of a "works in curl, fails on the page"
problem, and it cannot be fixed from the page. In n8n, the Webhook node has an
**Allowed Origins (CORS)** option under Options.

---

## 3. The plain page

`website/index.html`. Everything you edit is in the `SETUP` block at the top of its script. A
comment block at the very top of the file lists the same steps.

### 3.1 Placeholders

| Placeholder | Where in the file | Replace with |
|---|---|---|
| `AGENT_CHAT_URL` (`"PASTE_YOUR_AGENT_CHAT_WEBHOOK_URL_HERE"`) | `SETUP` block | The full URL of your agent chat webhook |
| `LEAD_CAPTURE_URL` (`"PASTE_YOUR_LEAD_CAPTURE_WEBHOOK_URL_HERE"`) | `SETUP` block, right after the chat URL | The full URL of your lead capture webhook |
| `FORM_FIELDS` array (defaults: name, email, message) | `SETUP` block | Your own field list, with `id` values matching the keys your backend expects |
| `TEXT` object (optional) | `SETUP` block | Your own headings, button labels and messages |
| `REQUEST_TIMEOUT_MS` (optional, default 60000) | `SETUP` block | A different timeout in milliseconds, if your agent is slow |
| `<title>` tag (optional) | `<head>` | Your page title |
| CSS variables in `:root` (optional) | `<style>` block | Your colours, radius and font |

Both URL constants are checked at runtime. If either still starts with `PASTE_YOUR_`, the
matching half of the page sends nothing and says so on the page: the chat when the page loads,
the form when you press Submit.

The webhook URLs are visible to anyone who views the page source. Treat them as public, and
protect them on the n8n side (validation, rate limiting) if that matters for your use.

### 3.2 Changing the form fields

The form is generated at page load from the `FORM_FIELDS` array. Each entry is one field:

```js
{ id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }
```

| Property | Required | What it does |
|---|---|---|
| `id` | Yes, unique | The key in the JSON sent to the workflow, and the basis for the element ids |
| `label` | Yes | The text above the input |
| `type` | Yes | One of `text`, `email`, `tel`, `url`, `number`, `textarea`, `select`, `checkbox` |
| `required` | No, default false | Blocks submit when empty. For a checkbox, it must be ticked |
| `placeholder` | No | Hint text. For a `select`, the text of the empty first option |
| `options` | Only for `select` | An array of strings, for example `["Small", "Large"]` |

To add a field, add an entry. To remove one, delete its entry. To rename what the visitor sees,
change `label`. To change the JSON key, change `id`. To change the input kind, change `type`.
No other code needs touching, because validation, rendering and the request body all read from
the array.

What gets sent: a `checkbox` sends `true` or `false`, a `number` sends a number (or an empty
string if left blank), and every other type sends a trimmed string.

If you change a field, the workflow may need changing too. Section 4.5 says where.

### 3.3 Behaviour

- Visible text is written with `textContent`, never `innerHTML`, so a reply from the backend
  cannot inject markup. The reply is shown as plain text, with no markdown.
- Validation on the page is deliberately basic: required fields, and a simple
  `something@something.tld` pattern for email fields. The workflow should validate too.
- Left out on purpose: markdown or streaming replies, stored chat history, file uploads, radio
  groups, spam protection such as a honeypot or captcha, analytics, and any external font or
  script.
- The design is a plain light theme with one blue accent and a system font stack, meant to be
  reskinned through the CSS variables.

---

## 4. The workflow

`workflow/ampersand-workflow.json`. One n8n workflow with two independent chains, each starting
at its own webhook. Import it as described in the main README, then use this section to see what
each node does.

### 4.1 The agent chain

Answers a chat message from your knowledge base.

| Node | What it does |
|---|---|
| `Ampersand - Agent Webhook` | Receives the `POST` on the path `agent-chat` |
| `Ampersand - RAG Agent` | The AI Agent. Takes `message` from the request, and has the three nodes below attached |
| `Ampersand - Anthropic` | The chat model. Its model id is the placeholder `PASTE_YOUR_CHAT_MODEL_ID_HERE` |
| `Ampersand - Chat Memory` | Postgres chat memory in the table `chat_messages`, keyed by `session_id`, with a context window of 10 |
| `Ampersand - Vector Store` | Supabase vector store in "retrieve as tool" mode, reading the table `documents`. This is how the agent searches your knowledge base |
| `Ampersand - Embeddings Google Gemini` | Embeds the question with the model named by `PASTE_YOUR_EMBEDDING_MODEL_HERE`, so it can be matched against the stored chunks |
| `Ampersand - Agent Response` | Returns `{ "reply": ... }` to the page |

The chunks in `documents` must have been embedded with the same model as the Embeddings node, or
the node must be changed to the model you used. How the knowledge base is split, embedded and
stored is not part of this repository. The demo's own choices are written up in
[`../demo/TECHNICAL.md`](../demo/TECHNICAL.md#1-knowledge-base-and-chunking) as one example.

### 4.2 The lead chain

Scores a form submission, saves it, and notifies an owner when the lead is a strong one.

| Node | What it does |
|---|---|
| `Ampersand - Lead Webhook` | Receives the `POST` on the path `lead-capture` |
| `Ampersand - Score Lead` | A Code node. Adds up the points in the table below, and marks the lead `high` when the total is 12 or more, otherwise `low` |
| `Ampersand - Insert Lead` | Saves every lead to the `leads` table, whatever its score, with `status` set to `new` |
| `Ampersand - Check Intent` | An IF node. `high` continues, anything else skips to the response |
| `Ampersand - Route by Warehouse Count` | A Switch node with four branches, matching `warehouse_count` exactly against `1`, `2-5`, `6-10` and `10+` |
| `Ampersand - Notify Owner (1 / 2-5 / 6-10 / 10+ Warehouses)` | Four Email Send nodes, one per branch, each sending the lead's details |
| `Ampersand - Update Lead (1 / 2-5 / 6-10 / 10+ Warehouses)` | Four Supabase update nodes. Each finds the lead by `id`, then sets `email_sent` to true and `assigned_owner` to `Owner A`, `Owner B`, `Owner C` or `Owner D` |
| `Ampersand - Lead Response` | Returns `{ "success": true, "message": "Thanks for reaching out! Our team will be in touch soon." }` |

Every submission gets that same response, high intent or low, so the visitor never learns their
score or where it went. The one exception is a high-intent lead whose `warehouse_count` matches
none of the four Switch values: the Switch has no fallback output, so that lead is saved but the
request may get no confirmation. Keep the page's options identical to the Switch values.

**Scoring.** Values are matched exactly, including capitalisation and spacing. A value that does
not match scores 0 for that field. The highest possible score is 20.

| Field | Value and points |
|---|---|
| `warehouse_count` | `1` is 1, `2-5` is 3, `6-10` is 5, `10+` is 6 |
| `order_volume` | `Under 500` is 1, `500 to 5000` is 3, `5000 to 20000` is 5, `20000+` is 6 |
| `current_tooling` | `Spreadsheets or manual` is 4, `Nothing` is 2, `Another platform` is 1 |
| `timeline` | `This month` is 4, `This quarter` is 2, `Just exploring` is 0 |

### 4.3 What the workflow reads and writes

| Table | Touched by | Columns |
|---|---|---|
| `documents` | Vector Store | The stored chunks and their embeddings |
| `match_documents` (a database function) | Vector Store | The similarity search over `documents`. n8n's Supabase vector store node calls a function of this name by default |
| `chat_messages` | Chat Memory | The conversation, in the shape n8n's Postgres Chat Memory node requires |
| `leads` | Insert Lead, Update Lead | `id`, `name`, `company`, `warehouse_count`, `order_volume`, `current_tooling`, `timeline`, `score`, `intent`, `email`, `status`, `email_sent`, `assigned_owner` |

Creating these tables is up to you. The demo's version of all three is described in
[`../demo/TECHNICAL.md`](../demo/TECHNICAL.md#3-supabase-schema).

### 4.4 Placeholders inside the workflow

| Placeholder | Nodes | Replace with |
|---|---|---|
| Credentials named like `... (add your own)`, with an empty id | Chat Memory, Anthropic, Vector Store, Embeddings Google Gemini, Insert Lead, the four Update Lead nodes, the four Notify Owner nodes (13 nodes) | Your own credential of that type |
| `PASTE_YOUR_CHAT_MODEL_ID_HERE` as the model | The Anthropic node | A chat model id your account can call |
| `PASTE_YOUR_EMBEDDING_MODEL_HERE` as the model name | The Embeddings Google Gemini node | The embedding model your knowledge base was embedded with |
| `you@example.com` in From Email | The four Notify Owner nodes | The address you send from |
| `sales@example.com` in To Email | The four Notify Owner nodes | The recipient for that branch |

The workflow imports switched off. Which credential type goes on which node is in the main
README, section 3.4.

### 4.5 Where to change things

Some of the workflow is written for the fictional Flowdeck demo. This is where that lives:

| What | Where | It currently |
|---|---|---|
| What the agent says and will not say | System prompt on `Ampersand - RAG Agent` | Names Flowdeck, and forbids stating any price |
| What the agent's search is described as | Tool description on `Ampersand - Vector Store` | Describes Flowdeck's product, pricing and company |
| The notification emails | Subject and body of each Notify Owner node | Say "New Flowdeck Lead", and end with a line specific to that branch |
| How leads are scored and what counts as high | `Ampersand - Score Lead`, the weight tables and the `>= 12` line | Uses the weights in section 4.2 |
| Who a lead goes to | `Ampersand - Route by Warehouse Count` for the rule, the Notify Owner nodes for the recipient | Routes by warehouse count to four branches |
| The label saved on a routed lead | The four Update Lead nodes | `Owner A` to `Owner D` |
| What is saved per lead | `Ampersand - Insert Lead`, the field mapping | The columns in section 4.3 |

If you rename or add a form field, change the page's `FORM_FIELDS` and the node that reads it in
step with each other. The scoring tables and the Switch match exact wording, so the page's
options must be written to match them.

---

## 5. Testing status

The page was tested in a browser against a mocked backend: placeholder handling, the chat round
trip, form validation, success and failure states, and mobile width. That included the
seven-field configuration in section 2, which produced the request the workflow reads.

The page and the workflow have not been run together against a live n8n instance. The workflow
was built and used with the demo site. Run the pair against your own endpoints before relying on
it.
