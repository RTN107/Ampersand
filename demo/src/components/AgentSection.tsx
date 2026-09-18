import Amp from './Amp';
import { useAgent } from './AgentContext';
import { agent } from '../lib/content';
import { DEMO_MODE } from '../config';

/** The agent's home on the page. Everything here opens the same panel. */
export default function AgentSection() {
  const { openPanel } = useAgent();

  return (
    <section className="agentsec" id="agent">
      <div className="container agentsec__grid">
        <div className="agentsec__copy">
          <h2 data-reveal>{agent.title}</h2>
          <p className="lede" data-reveal>
            {agent.body}
          </p>
          <button type="button" className="btn btn--primary" onClick={() => openPanel()} data-reveal>
            Open the agent
          </button>
        </div>

        <div className="agentsec__preview" data-reveal>
          <div className="agentsec__bar">
            <Amp />
            <div>
              <strong>Ask Flowdeck AI</strong>
              <small>{agent.tagline}</small>
            </div>
            {DEMO_MODE && <span className="agent__demo" style={{ marginLeft: 'auto' }}>Demo</span>}
          </div>
          <div className="agentsec__body">
            <p>Try one of these</p>
            {agent.starters.map((q) => (
              <button
                key={q}
                type="button"
                className="chip"
                disabled={DEMO_MODE}
                onClick={() => openPanel(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="agentsec__composer" onClick={() => openPanel()} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') openPanel(); }}>
            <span>{DEMO_MODE ? agent.demoPlaceholder : agent.composerPlaceholder}</span>
            <span className="btn btn--primary btn--sm">Send</span>
          </div>
        </div>
      </div>
    </section>
  );
}
