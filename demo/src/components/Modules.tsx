import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { modules, reconciliation } from '../lib/content';
import { ScrollTrigger, REDUCED } from '../lib/motion';

/* ---- Mockups: static, with one small animation each ---- */

function StockMock() {
  const rows = [
    { name: 'Warehouse A', w: '72%', tag: '1,240 units' },
    { name: 'Warehouse B', w: '16%', tag: 'Low stock', low: true },
    { name: 'Warehouse C', w: '58%', tag: '830 units' },
  ];
  return (
    <div className="mock mock--stock" aria-hidden="true">
      <div className="mock__title">
        Stock across locations <small>Live</small>
      </div>
      {rows.map((r) => (
        <div className={`stock__row${r.low ? ' is-low' : ''}`} key={r.name}>
          <span>{r.name}</span>
          <div className="stock__bar">
            <i style={{ '--w': r.w } as CSSProperties} />
          </div>
          <span className="stock__tag">{r.tag}</span>
        </div>
      ))}
    </div>
  );
}

function RouteMock() {
  // A simple map: driver positions plotted as points, one order marker
  // plotted separately, and a direct line to whichever driver is nearest.
  // The near pair sits well apart from the far cluster so "closest" reads
  // unambiguously, and "nearest" is computed, never hand-picked, so it can
  // never drift out of sync with the actual positions below.
  const order = { x: 410, y: 175 };
  const drivers = [
    { x: 70, y: 55 },
    { x: 110, y: 188 },
    { x: 185, y: 62 },
    { x: 355, y: 145 },
  ];
  const nearest = drivers.reduce((closest, d) =>
    Math.hypot(d.x - order.x, d.y - order.y) < Math.hypot(closest.x - order.x, closest.y - order.y)
      ? d
      : closest,
  );
  const pin = (cx: number, cy: number, r: number) =>
    `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

  return (
    <div className="mock mock--route route" aria-hidden="true">
      <div className="mock__title">
        Dispatch <small>New order came in</small>
      </div>
      <svg viewBox="0 0 480 240">
        <defs>
          <pattern id="route-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" className="route__grid-dot" />
          </pattern>
        </defs>
        <rect className="route__map" x="1" y="1" width="478" height="238" rx="10" />
        <rect x="1" y="1" width="478" height="238" rx="10" fill="url(#route-grid)" />

        <path
          className="route__connector"
          d={`M ${order.x} ${order.y} L ${nearest.x} ${nearest.y}`}
        />

        {drivers.map((d, i) => {
          const isNear = d === nearest;
          return (
            <g key={i}>
              {isNear && <circle className="route__ring" cx={d.x} cy={d.y} r="9" />}
              <circle
                className={isNear ? 'route__driver route__driver--near' : 'route__driver'}
                cx={d.x}
                cy={d.y}
                r="6"
              />
            </g>
          );
        })}
        <text className="route__label route__label--near" x={nearest.x - 40} y={nearest.y - 18}>
          Closest driver
        </text>

        <polygon className="route__pin" points={pin(order.x, order.y, 7)} />
        <text className="route__label route__label--order" x={order.x - 62} y={order.y + 26}>
          New order
        </text>
      </svg>
    </div>
  );
}

function OrderMock() {
  return (
    <div className="mock mock--order" aria-hidden="true">
      <div className="mock__title">
        Order routing <small>Any sales channel</small>
      </div>
      <div className="order">
        <div className="order__chip">
          <span className="order__chip-title">New order</span>
          <small>Routed by stock and location</small>
        </div>
        <div className="order__line" />
        <div className="order__nodes">
          <div className="order__node">
            <span className="order__node-label">Warehouse A</span>
            <small>Far</small>
          </div>
          <div className="order__node order__node--best">
            <span className="order__node-label">Warehouse B</span>
            <small>Close, in stock</small>
          </div>
          <div className="order__node">
            <span className="order__node-label">Warehouse C</span>
            <small>Out of stock</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceMock() {
  // The compact preview carries the same mismatch moment as the dedicated
  // reconciliation section below: rows settle in, then the one row that
  // doesn't match flags itself. Kept to a single CSS-driven sequence.
  return (
    <div className="mock mock--ledgermini" aria-hidden="true">
      <div className="mock__title">
        Reconciliation <small>Same day</small>
      </div>
      <div className="ledgermini">
        <div className="ledgermini__head">
          <span>Order</span>
          <span>Shipped</span>
          <span>Billed</span>
          <span className="ledgermini__handling">Handling</span>
          <span className="ledgermini__status">Status</span>
        </div>
        {reconciliation.rows.map((r, i) => (
          <div
            className={`ledgermini__row${r.ok ? '' : ' ledgermini__row--flag'}`}
            style={{ '--i': i } as CSSProperties}
            key={r.order}
          >
            <strong>{r.order}</strong>
            <span>{r.shipped}</span>
            <span className="ledgermini__billed">{r.billed}</span>
            <span className="ledgermini__handling">{r.handling}</span>
            <span className="ledgermini__status">
              {r.ok ? (
                <span className="ledgermini__ok">
                  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Matched
                </span>
              ) : (
                <span className="ledgermini__flag">{r.reason}</span>
              )}
            </span>
          </div>
        ))}
        <div className="ledgermini__foot">
          <span>Checked the same day the invoice arrives</span>
          <span>Every order, not a sample</span>
        </div>
      </div>
    </div>
  );
}

const MOCKS = { stock: StockMock, route: RouteMock, order: OrderMock, invoice: InvoiceMock } as const;

export default function Modules() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const panels = Array.from(el.querySelectorAll<HTMLElement>('.modpanel'));
    if (REDUCED) {
      panels.forEach((p) => p.classList.add('is-live'));
      return;
    }
    const triggers = panels.map((p, i) =>
      ScrollTrigger.create({
        trigger: p,
        start: 'top 62%',
        end: 'bottom 38%',
        onEnter: () => {
          setActive(i);
          p.classList.add('is-live');
        },
        onEnterBack: () => setActive(i),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section className="modules" id="product" ref={root}>
      <div className="container modules__grid">
        <div className="modules__stick">
          <h2 data-reveal>{modules.title}</h2>
          <ol className="modules__list">
            {modules.items.map((m, i) => (
              <li className={`modules__item${i === active ? ' is-active' : ''}`} key={m.key}>
                <div className="modules__name">{m.name}</div>
                <div className="modules__body">
                  <p>{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="modules__panels">
          {modules.items.map((m) => {
            const Mock = MOCKS[m.key];
            return (
              <article className="modpanel" key={m.key}>
                <Mock />
                <div className="modpanel__meta">
                  <h3>{m.name}</h3>
                  <p>{m.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
