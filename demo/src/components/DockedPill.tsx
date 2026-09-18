import { useEffect, useState } from 'react';
import Amp from './Amp';
import { useAgent } from './AgentContext';

/** Docks to the bottom centre once the hero's ask bar has scrolled away. */
export default function DockedPill() {
  const { open, openPanel } = useAgent();
  const [past, setPast] = useState(false);

  useEffect(() => {
    const bar = document.querySelector('.hero__ask');
    if (!bar) return;
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    io.observe(bar);
    return () => io.disconnect();
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <button
      type="button"
      className={`pill${past && !open ? ' is-visible' : ''}`}
      onClick={() => openPanel()}
      aria-label="Ask Flowdeck"
      tabIndex={past && !open ? 0 : -1}
    >
      <Amp />
      <span className="pill__label">Ask Flowdeck</span>
      <span className="pill__hint">{isMac ? '⌘' : 'Ctrl'} K</span>
    </button>
  );
}
