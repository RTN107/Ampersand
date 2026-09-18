import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { sendChat } from '../lib/api';
import { DEMO_MODE } from '../config';
import { lockScroll } from '../lib/scroll';

export type Msg = { id: number; role: 'user' | 'agent'; text: string; animate: boolean };
export type Status = 'idle' | 'thinking' | 'error';

type Ctx = {
  open: boolean;
  openPanel: (question?: string) => void;
  closePanel: () => void;
  messages: Msg[];
  status: Status;
  send: (text: string) => void;
  retry: () => void;
  sessionId: string;
};

const AgentContext = createContext<Ctx | null>(null);

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for non-secure contexts. Same shape, same purpose.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function AgentProvider({ children }: { children: ReactNode }) {
  // One session id per page view, generated on mount and held in memory only.
  // A reload starts a fresh conversation. This is the intended behaviour.
  const [sessionId] = useState(newSessionId);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const lastFailed = useRef<string | null>(null);
  const nextId = useRef(0);

  const dispatch = useCallback(
    async (text: string) => {
      setStatus('thinking');
      lastFailed.current = text;
      try {
        const reply = await sendChat(text, sessionId);
        setMessages((m) => [...m, { id: ++nextId.current, role: 'agent', text: reply, animate: true }]);
        lastFailed.current = null;
        setStatus('idle');
      } catch {
        setStatus('error');
      }
    },
    [sessionId],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || DEMO_MODE) return;
      setMessages((m) => [...m, { id: ++nextId.current, role: 'user', text, animate: false }]);
      void dispatch(text);
    },
    [dispatch],
  );

  const retry = useCallback(() => {
    const text = lastFailed.current;
    if (text) void dispatch(text);
  }, [dispatch]);

  const openPanel = useCallback(
    (question?: string) => {
      setOpen(true);
      if (question) send(question);
    },
    [send],
  );

  const closePanel = useCallback(() => setOpen(false), []);

  useEffect(() => {
    lockScroll(open);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) closePanel();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closePanel]);

  const value = useMemo<Ctx>(
    () => ({ open, openPanel, closePanel, messages, status, send, retry, sessionId }),
    [open, openPanel, closePanel, messages, status, send, retry, sessionId],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent(): Ctx {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used inside AgentProvider');
  return ctx;
}
