# Generic website reference

## File

`index.html` in this folder is a single static HTML file (inline CSS, vanilla JavaScript, no dependencies) with a chat widget wired to an AI agent webhook and a configurable contact form wired to a lead-capture webhook.

## Placeholders

| Placeholder | Where in the file | Replace with |
|---|---|---|
| `AGENT_CHAT_URL` (`"PASTE_YOUR_AGENT_CHAT_WEBHOOK_URL_HERE"`) | `SETUP` section at the top of the `<script>` block | Full URL of your agent chat webhook |
| `LEAD_CAPTURE_URL` (`"PASTE_YOUR_LEAD_CAPTURE_WEBHOOK_URL_HERE"`) | `SETUP` section, right after the chat URL | Full URL of your lead capture webhook |
| `FORM_FIELDS` array (defaults: name, email, message) | `SETUP` section | Your own field list, with `id` values matching the keys your backend expects |
| `TEXT` object (optional) | `SETUP` section | Your own headings, button labels, and messages |
| `REQUEST_TIMEOUT_MS` (optional, default 60000) | `SETUP` section | A different timeout in milliseconds, if your agent is slow |
| `<title>` tag (optional) | `<head>` | Your page title |
| CSS variables in `:root` (optional) | `<style>` block | Your colors, radius, and font |

There is also a comment block at the very top of the file listing these same steps.

Both URL constants are checked at runtime. If either still starts with `PASTE_YOUR_`, the matching feature shows an on-page message and sends nothing.

## How the form customization works

The form is generated at page load from the `FORM_FIELDS` array. Each entry is one field:

```js
{ id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" }
```

- `id` (required, unique): the key in the JSON sent to the backend, and the basis for the element ids.
- `label` (required): text shown above the input.
- `type` (required): one of `text`, `email`, `tel`, `url`, `number`, `textarea`, `select`, `checkbox`.
- `required` (optional, default false): blocks submit when empty. For a checkbox, it must be checked.
- `placeholder` (optional): hint text. For a `select`, it is the text of the empty first option.
- `options` (only for `select`): array of strings, for example `["Small", "Large"]`.

To add a field, add an entry. To remove one, delete its entry. To rename what the visitor sees, change `label`. To change the JSON key, change `id`. To change the input kind, change `type`. No other code is touched. Validation, rendering, and payload building all read from the array.

Value handling in the payload: `checkbox` sends `true` or `false`, `number` sends a number (or an empty string if left blank), every other type sends a trimmed string.

## Request and response shapes

### Chat

Request: `POST AGENT_CHAT_URL`, header `Content-Type: application/json`

```json
{ "message": "text the visitor typed", "session_id": "uuid string" }
```

`session_id` is generated once per page load with `crypto.randomUUID()` (with a fallback generator) and held in memory only. A page reload starts a new session.

Expected response (HTTP 2xx, JSON):

```json
{ "reply": "text to display" }
```

Anything else (non-2xx status, invalid JSON, missing or non-string `reply`, network error, timeout) shows a visible error message in the conversation.

### Lead capture

Request: `POST LEAD_CAPTURE_URL`, header `Content-Type: application/json`

Flat object, one key per `FORM_FIELDS` id. With the default fields:

```json
{ "name": "string", "email": "string", "message": "string" }
```

Expected response (HTTP 2xx, JSON):

```json
{ "success": true, "message": "text to display" }
```

`success: true` shows `message` in a success banner and resets the form. `success: false` shows `message` in an error banner and keeps the entered values. A non-2xx status, invalid JSON, or a response where `success` is not a boolean or `message` is not a string shows the generic `TEXT.leadError` message.

## Decisions and open points

- Visible text is written with `textContent`, never `innerHTML`, so backend replies cannot inject markup. The reply is displayed as plain text; there is no markdown rendering.
- Client-side validation is intentionally basic: required fields, and a simple `something@something.tld` pattern for email fields. The backend should validate independently.
- CORS: the file is static and calls the webhooks from the browser, so the backend must allow cross-origin POST with a JSON content type (including the preflight `OPTIONS` request). This is the most likely cause of a "works in curl, fails on the page" problem, and it cannot be fixed from this file.
- The webhook URLs are visible to anyone who views the page source. Treat them as public and protect them server-side (rate limiting, validation) if that matters for your use case.
- The chat sends only the latest message plus `session_id`. Conversation memory is expected to live on the backend, keyed by `session_id`.
- Left out on purpose: markdown or streaming replies, persisted chat history, file upload fields, radio groups, spam protection (honeypot or captcha), analytics, and any external fonts or scripts.
- Design is a plain light theme with a single blue accent and a system font stack, meant to be reskinned through the CSS variables.
- Tested in a browser against a mocked backend (placeholder handling, chat round trip, form validation, success and failure states, mobile width). Not tested against a live backend, so run it against your own endpoints before relying on it.
