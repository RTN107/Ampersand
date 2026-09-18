import { AGENT_CHAT_URL, LEAD_CAPTURE_URL, DEMO_MODE } from '../config';
import type { LeadPayload } from './tier';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const data = (await res.json()) as unknown;
  // n8n occasionally wraps a single item in an array. Unwrap without changing meaning.
  return (Array.isArray(data) ? data[0] : data) as T;
}

export async function sendChat(message: string, sessionId: string): Promise<string> {
  if (DEMO_MODE) throw new Error('Demo mode: the agent is switched off.');
  const data = await post<{ reply?: unknown }>(AGENT_CHAT_URL, {
    message,
    session_id: sessionId,
  });
  if (typeof data?.reply !== 'string') throw new Error('The agent returned no reply.');
  return data.reply;
}

export type LeadResponse = { success: boolean; message: string };

export async function sendLead(payload: LeadPayload): Promise<LeadResponse> {
  if (DEMO_MODE) throw new Error('Demo mode: sending is switched off.');
  const data = await post<Partial<LeadResponse>>(LEAD_CAPTURE_URL, payload);
  return {
    success: data?.success === true,
    message:
      typeof data?.message === 'string'
        ? data.message
        : 'Thanks for reaching out! Our team will be in touch soon.',
  };
}
