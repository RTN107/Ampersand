import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/instrument-serif';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/agent.css';
import './styles/quote.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
