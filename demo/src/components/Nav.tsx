import { useEffect, useState, type MouseEvent } from 'react';
import Amp from './Amp';
import { useAgent } from './AgentContext';
import { scrollTo } from '../lib/scroll';
import { openQuote } from '../lib/bus';

const LINKS = [
  { href: '#product', label: 'Products' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export default function Nav() {
  const { openPanel } = useAgent();
  const [scrolled, setScrolled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const id = window.setTimeout(() => setReady(true), 50);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(id);
    };
  }, []);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollTo(href);
  };

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${ready ? ' is-ready' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand" onClick={(e) => go(e, '#top')}>
          <Amp />
          Flowdeck
        </a>
        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="tlink" onClick={(e) => go(e, l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        <span className="nav__spacer" />
        <button type="button" className="nav__ask" onClick={() => openPanel()}>
          <Amp />
          <span>Ask Flowdeck</span>
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => openQuote()}>
          Get a quote
        </button>
      </div>
    </header>
  );
}
