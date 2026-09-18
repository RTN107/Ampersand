# Flowdeck demo site

The polished demo from the [main README](../README.md): a full marketing site for a fictional
logistics software company, with a live AI agent and a lead capture form wired to the agent
and lead chains of the n8n workflow in [`../generic/workflow`](../generic/workflow).

For how the agent, the knowledge base, the database and the lead scoring work underneath, see
[`TECHNICAL.md`](TECHNICAL.md).

## Run it locally

Requires Node.js 20.19 or newer (22.12 or newer also works). Nothing else.

```
cd demo
npm install
cp .env.example .env     # then fill in your own webhook URLs
npm run dev              # http://localhost:5173
```

The page loads without a `.env`, but the agent and the form need the two webhook URLs below
before they will do anything.

```
npm run build            # type check, then a production bundle in dist/
npm run preview          # serve dist/
```

## Environment variables

Set in `.env`, copied from `.env.example`. `.env` is git-ignored, never commit it.

| Variable | What it is |
|---|---|
| `VITE_AGENT_CHAT_URL` | Your n8n webhook URL for the agent chat. Receives `{ message, session_id }`, returns `{ reply }` |
| `VITE_LEAD_CAPTURE_URL` | Your n8n webhook URL for lead capture. Receives the seven form fields, returns `{ success, message }` |
| `VITE_DEMO_MODE` | Optional. `true` keeps the agent and the form visible but switched off, with no network calls at all. Useful for hosting the site without a backend |

## Where things live

| Path | What it is |
|---|---|
| `src/config.ts` | Reads the three variables above. The only place environment values enter the code |
| `src/lib/api.ts` | The only module that makes network calls: one function for chat, one for the form |
| `src/lib/content.ts` | Every word of copy on the page, drawn from the knowledge base |
| `src/lib/tier.ts` | The exact form values the workflow's scoring expects, and the tier rule |
| `src/components/AgentPanel.tsx` | The expanded chat panel |
| `src/components/AgentContext.tsx` | Chat state, the per-visit session id, error and retry handling |
| `src/components/AskBar.tsx`, `DockedPill.tsx`, `AgentSection.tsx` | The three other ways into the chat |
| `src/components/QuoteForm.tsx` | The three step lead capture form |
| `src/components/HeroField.tsx` | The animated hero background, a WebGL particle field |
| `knowledge/flowdeck-knowledge-base.md` | The source document the agent answers from |

## A note on npm scripts

If the folder this is cloned into has an ampersand in its path, npm's Windows command shims
(`tsc.cmd`, `vite.cmd`) break. The scripts in `package.json` call the tools directly through
`node node_modules/...` instead, which works whatever the path is.
