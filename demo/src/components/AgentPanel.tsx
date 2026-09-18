import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Amp from './Amp';
import { useAgent, type Msg } from './AgentContext';
import { agent as copy } from '../lib/content';
import { DEMO_MODE } from '../config';
import { openQuote } from '../lib/bus';

const FORM_HINT = /contact form|quote|fill (in|out) the form/i;

function Reveal({ text, animate, onTick }: { text: string; animate: boolean; onTick: () => void }) {
  const tokens = useMemo(() => text.split(/(\s+)/).filter((t) => t.length > 0), [text]);
  const [n, setN] = useState(animate ? 0 : tokens.length);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i % 4 === 0) onTick();
      if (i >= tokens.length) window.clearInterval(id);
    }, 20);
    return () => window.clearInterval(id);
    // Runs once per message: the text of a message never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} className={`word${i < n ? ' is-in' : ''}`}>
          {t}
        </span>
      ))}
    </>
  );
}

function Message({ m, onTick, onFormCta }: { m: Msg; onTick: () => void; onFormCta: () => void }) {
  if (m.role === 'user') {
    return (
      <div className="msg msg--user">
        <div className="msg__text">{m.text}</div>
      </div>
    );
  }
  const suggestsForm = FORM_HINT.test(m.text);
  return (
    <div className="msg msg--agent">
      <Amp />
      <div>
        <div className="msg__text">
          <Reveal text={m.text} animate={m.animate} onTick={onTick} />
        </div>
        {suggestsForm && (
          <div className="msg__cta">
            <button type="button" className="btn btn--primary btn--sm" onClick={onFormCta}>
              {copy.formCta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentPanel() {
  const { open, closePanel, messages, status, send, retry } = useAgent();
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === 'thinking';

  const scrollToEnd = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, status, scrollToEnd]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 380);
    return () => window.clearTimeout(id);
  }, [open]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || DEMO_MODE) return;
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const grow = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const goToForm = () => {
    closePanel();
    window.setTimeout(() => openQuote(), 250);
  };

  return (
    <>
      <div className={`agent-tint${open ? ' is-open' : ''}`} onClick={closePanel} aria-hidden="true" />
      <div className={`agent${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <section className="agent__panel" role="dialog" aria-modal="true" aria-label="Ask Flowdeck">
          <header className="agent__head">
            <Amp breathing={busy} />
            <div className="agent__title">
              <h2>Ask Flowdeck AI</h2>
            </div>
            {DEMO_MODE && <span className="agent__demo">Demo</span>}
            <button type="button" className="agent__close" onClick={closePanel} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="agent__log" ref={logRef} data-lenis-prevent>
            {messages.length === 0 && (
              <div className="agent__empty">
                <Amp />
                <h3>What would you like to know?</h3>
                <p>{copy.body}</p>
                <div className="agent__chips">
                  {copy.starters.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="chip"
                      disabled={DEMO_MODE || busy}
                      onClick={() => send(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <Message key={m.id} m={m} onTick={scrollToEnd} onFormCta={goToForm} />
            ))}

            {busy && (
              <div className="msg msg--thinking" aria-live="polite">
                <Amp breathing />
                <span>Thinking</span>
              </div>
            )}

            {status === 'error' && (
              <div className="agent__error" role="alert">
                <span>{copy.errorText}</span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={retry}>
                  Retry
                </button>
              </div>
            )}
          </div>

          <form className="agent__composer" onSubmit={submit}>
            <textarea
              ref={inputRef}
              className="agent__input"
              rows={1}
              value={draft}
              placeholder={DEMO_MODE ? copy.demoPlaceholder : copy.composerPlaceholder}
              disabled={DEMO_MODE}
              onChange={(e) => setDraft(e.target.value)}
              onInput={grow}
              onKeyDown={onKey}
              data-lenis-prevent
              aria-label="Your question"
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={DEMO_MODE || busy || !draft.trim()}>
              Send
            </button>
          </form>
          <span className="agent__hint">
            {DEMO_MODE ? 'This showcase build makes no network calls.' : 'Enter to send. Shift and Enter for a new line. Esc to close.'}
          </span>
        </section>
      </div>
    </>
  );
}
