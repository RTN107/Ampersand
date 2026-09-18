import { useEffect, useRef, useState, type FormEvent } from 'react';
import Amp from './Amp';
import { quote } from '../lib/content';
import { sendLead } from '../lib/api';
import { DEMO_MODE } from '../config';
import { QUOTE_PRESET_EVENT } from '../lib/bus';
import { gsap, REDUCED } from '../lib/motion';
import {
  ORDER_LABELS,
  ORDER_OPTIONS,
  TIMELINE_OPTIONS,
  TOOLING_OPTIONS,
  WAREHOUSE_LABELS,
  WAREHOUSE_OPTIONS,
  tierFor,
  type LeadPayload,
  type OrderVolume,
  type Timeline,
  type Tooling,
  type WarehouseCount,
} from '../lib/tier';

type Draft = {
  name: string;
  email: string;
  company: string;
  warehouse_count: WarehouseCount | '';
  order_volume: OrderVolume | '';
  current_tooling: Tooling | '';
  timeline: Timeline | '';
};

type Errors = Partial<Record<keyof Draft, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: Draft = {
  name: '',
  email: '',
  company: '',
  warehouse_count: '',
  order_volume: '',
  current_tooling: '',
  timeline: '',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(step: number, d: Draft): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!d.name.trim()) e.name = 'Enter your name.';
    if (!EMAIL.test(d.email.trim())) e.email = 'Enter a valid email address.';
    if (!d.company.trim()) e.company = 'Enter your company name.';
  }
  if (step === 1) {
    if (!d.warehouse_count) e.warehouse_count = 'Pick a warehouse count.';
    if (!d.order_volume) e.order_volume = 'Pick an order volume.';
  }
  if (step === 2) {
    if (!d.current_tooling) e.current_tooling = 'Pick one.';
    if (!d.timeline) e.timeline = 'Pick one.';
  }
  return e;
}

export default function QuoteForm() {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [sentMessage, setSentMessage] = useState('');

  const tier = draft.warehouse_count && draft.order_volume ? tierFor(draft.warehouse_count, draft.order_volume) : null;

  // The sheet settles into place as a physical object.
  useEffect(() => {
    const el = root.current;
    if (!el || REDUCED) return;
    const ctx = gsap.context(() => {
      gsap.from('.sheet', {
        rotateX: 9,
        rotateZ: -1.6,
        y: 90,
        opacity: 0,
        duration: 1.6,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.quote__stage', start: 'top 80%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // A tier's "Get a quote" button preselects the warehouse count.
  useEffect(() => {
    const onPreset = (e: Event) => {
      const preset = (e as CustomEvent<WarehouseCount>).detail;
      setDraft((d) => ({ ...d, warehouse_count: preset }));
    };
    window.addEventListener(QUOTE_PRESET_EVENT, onPreset);
    return () => window.removeEventListener(QUOTE_PRESET_EVENT, onPreset);
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const next = () => {
    const e = validate(step, draft);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, 2));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    const errs = validate(2, draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || DEMO_MODE || status === 'sending') return;

    // All seven fields are required strings with the exact backend labels.
    const payload: LeadPayload = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      company: draft.company.trim(),
      warehouse_count: draft.warehouse_count as WarehouseCount,
      order_volume: draft.order_volume as OrderVolume,
      current_tooling: draft.current_tooling as Tooling,
      timeline: draft.timeline as Timeline,
    };
    setStatus('sending');
    try {
      const res = await sendLead(payload);
      if (!res.success) {
        setStatus('error');
        return;
      }
      setSentMessage(res.message);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  const progress = status === 'sent' ? 100 : ((step + 1) / 3) * 100;

  return (
    <section className="quote" id="quote" ref={root}>
      <div className="container">
        <div className="quote__intro">
          <h2 data-reveal>{quote.title}</h2>
        </div>

        <div className="quote__stage">
          <form className="sheet" onSubmit={submit} noValidate>
            <aside className="sheet__margin">
              <div className="sheet__brand">
                <Amp />
                <div>
                  Flowdeck
                  <small>Quote request</small>
                </div>
              </div>

              <ol className="sheet__steps" aria-label="Steps">
                {quote.steps.map((s, i) => (
                  <li
                    key={s}
                    className={
                      status === 'sent' || i < step ? 'is-done' : i === step ? 'is-current' : ''
                    }
                  >
                    {s}
                  </li>
                ))}
              </ol>

              <div className={`sheet__tier${tier ? ' is-set' : ''}`} aria-live="polite">
                {tier ? (
                  <>
                    <small>Fits</small>
                    <strong>{tier}</strong>
                    <p>Set by whichever number is higher, warehouses or orders.</p>
                  </>
                ) : (
                  <p>{quote.margin.tierHint}</p>
                )}
              </div>
            </aside>

            <div className="sheet__main">
              <div className="sheet__progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>

              {status === 'sent' ? (
                <div className="sheet__sent" role="status">
                  <div className="stamp">
                    <Amp />
                    Received
                  </div>
                  <h3>{sentMessage}</h3>
                  <p>{quote.margin.next}</p>
                </div>
              ) : (
                <>
                  <div className="sheet__stepbody" key={step}>
                    <h3 className="sheet__steptitle">{quote.steps[step]}</h3>

                    {step === 0 && (
                      <>
                        <div className="field">
                          <label className="field__label" htmlFor="q-name">
                            {quote.fields.name}
                          </label>
                          <input
                            id="q-name"
                            className={`input${errors.name ? ' is-invalid' : ''}`}
                            value={draft.name}
                            onChange={(e) => set('name', e.target.value)}
                            autoComplete="name"
                          />
                          {errors.name && <span className="field__error">{errors.name}</span>}
                        </div>
                        <div className="field">
                          <label className="field__label" htmlFor="q-email">
                            {quote.fields.email}
                          </label>
                          <input
                            id="q-email"
                            type="email"
                            className={`input${errors.email ? ' is-invalid' : ''}`}
                            value={draft.email}
                            onChange={(e) => set('email', e.target.value)}
                            autoComplete="email"
                          />
                          {errors.email && <span className="field__error">{errors.email}</span>}
                        </div>
                        <div className="field">
                          <label className="field__label" htmlFor="q-company">
                            {quote.fields.company}
                          </label>
                          <input
                            id="q-company"
                            className={`input${errors.company ? ' is-invalid' : ''}`}
                            value={draft.company}
                            onChange={(e) => set('company', e.target.value)}
                            autoComplete="organization"
                          />
                          {errors.company && <span className="field__error">{errors.company}</span>}
                        </div>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <div className="field" role="group" aria-label={quote.fields.warehouses}>
                          <span className="field__label">{quote.fields.warehouses}</span>
                          <div className="tiles">
                            {WAREHOUSE_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="tile"
                                aria-pressed={draft.warehouse_count === opt}
                                onClick={() => set('warehouse_count', opt)}
                              >
                                {WAREHOUSE_LABELS[opt]}
                              </button>
                            ))}
                          </div>
                          {errors.warehouse_count && <span className="field__error">{errors.warehouse_count}</span>}
                        </div>
                        <div className="field" role="group" aria-label={quote.fields.orders}>
                          <span className="field__label">{quote.fields.orders}</span>
                          <div className="tiles">
                            {ORDER_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="tile"
                                aria-pressed={draft.order_volume === opt}
                                onClick={() => set('order_volume', opt)}
                              >
                                {ORDER_LABELS[opt]}
                              </button>
                            ))}
                          </div>
                          {errors.order_volume && <span className="field__error">{errors.order_volume}</span>}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="field" role="group" aria-label={quote.fields.tooling}>
                          <span className="field__label">{quote.fields.tooling}</span>
                          <div className="tiles">
                            {TOOLING_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="tile"
                                aria-pressed={draft.current_tooling === opt}
                                onClick={() => set('current_tooling', opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {errors.current_tooling && <span className="field__error">{errors.current_tooling}</span>}
                        </div>
                        <div className="field" role="group" aria-label={quote.fields.timeline}>
                          <span className="field__label">{quote.fields.timeline}</span>
                          <div className="tiles">
                            {TIMELINE_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="tile"
                                aria-pressed={draft.timeline === opt}
                                onClick={() => set('timeline', opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {errors.timeline && <span className="field__error">{errors.timeline}</span>}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="sheet__actions">
                    <button type="button" className="sheet__back" onClick={back} disabled={step === 0}>
                      Back
                    </button>
                    {status === 'error' && <span className="sheet__error">{quote.error}</span>}
                    {DEMO_MODE && step === 2 && <span className="sheet__demo">{quote.demoSubmit}</span>}
                    {step < 2 ? (
                      <button type="button" className="btn btn--ink" onClick={next}>
                        Continue
                      </button>
                    ) : (
                      <button type="submit" className="btn btn--ink" disabled={DEMO_MODE || status === 'sending'}>
                        {status === 'sending' ? 'Sending' : quote.submit}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
