import { useState, type FormEvent } from 'react';
import Amp from './Amp';
import { useAgent } from './AgentContext';
import { hero, agent } from '../lib/content';
import { DEMO_MODE } from '../config';

/** The agent's front door, sitting in the hero. */
export default function AskBar() {
  const { openPanel } = useAgent();
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (DEMO_MODE || !q) {
      openPanel();
      return;
    }
    openPanel(q);
    setValue('');
  };

  return (
    <form className="askbar" onSubmit={submit} role="search">
      <Amp />
      <input
        className="askbar__input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={DEMO_MODE ? agent.demoPlaceholder : hero.askPlaceholder}
        disabled={DEMO_MODE}
        aria-label="Ask Flowdeck"
        autoComplete="off"
      />
      <button type="submit" className="btn btn--primary btn--sm">
        Ask
      </button>
    </form>
  );
}
