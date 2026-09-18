/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENT_CHAT_URL: string;
  readonly VITE_LEAD_CAPTURE_URL: string;
  readonly VITE_DEMO_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
