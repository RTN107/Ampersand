// Every project-specific value lives here and nowhere else.
//
// This is the public copy of the site: no secrets and no hardcoded URLs.
// Every value below is read from the environment. Copy `.env.example` to
// `.env` and fill in your own n8n webhook URLs before running this locally.

// When true, the site makes zero network calls: the agent and the form are
// visibly switched off. Used for the public demo build.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// n8n webhook URLs. The demo was recorded with n8n's test-mode webhooks,
// which accept exactly one request after "Execute workflow" is clicked in
// the n8n editor, so the canvas lights up live as a request passes through.
// Set your own workflow's webhook URLs in `.env`; see `.env.example` and
// the main README in the repository root.
export const AGENT_CHAT_URL = import.meta.env.VITE_AGENT_CHAT_URL ?? '';
export const LEAD_CAPTURE_URL = import.meta.env.VITE_LEAD_CAPTURE_URL ?? '';
