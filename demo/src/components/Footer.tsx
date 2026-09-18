import type { MouseEvent } from 'react';
import Amp from './Amp';
import { useAgent } from './AgentContext';
import { footer } from '../lib/content';
import { scrollTo } from '../lib/scroll';
import { openQuote } from '../lib/bus';

export default function Footer() {
  const { openPanel } = useAgent();
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollTo(href);
  };

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand">
            <Amp />
            Flowdeck
          </div>
          <p>{footer.line}</p>
          <p>{footer.origin}</p>
        </div>
        <div className="footer__col">
          <strong>Sections</strong>
          <a href="#product" className="tlink" onClick={(e) => go(e, '#product')}>Products</a>
          <a href="#pricing" className="tlink" onClick={(e) => go(e, '#pricing')}>Pricing</a>
          <a href="#faq" className="tlink" onClick={(e) => go(e, '#faq')}>FAQ</a>
        </div>
        <div className="footer__col">
          <strong>Talk to us</strong>
          <a href="#quote" className="tlink" onClick={(e) => { e.preventDefault(); openQuote(); }}>Get a quote</a>
          <a href="#agent" className="tlink" onClick={(e) => { e.preventDefault(); openPanel(); }}>Ask Flowdeck</a>
        </div>
      </div>
    </footer>
  );
}
