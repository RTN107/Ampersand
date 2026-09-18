import { useEffect } from 'react';
import { AgentProvider, useAgent } from './components/AgentContext';
import HeroField from './components/HeroField';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Convergence from './components/Convergence';
import Modules from './components/Modules';
import Pricing from './components/Pricing';
import AgentSection from './components/AgentSection';
import QuoteForm from './components/QuoteForm';
import Faq from './components/Faq';
import Footer from './components/Footer';
import DockedPill from './components/DockedPill';
import AgentPanel from './components/AgentPanel';
import { initScroll } from './lib/scroll';
import { gsap, ScrollTrigger, REDUCED } from './lib/motion';

function Shell() {
  const { open } = useAgent();

  // Runs after every section has mounted.
  useEffect(() => {
    initScroll();
    const els = gsap.utils.toArray<HTMLElement>('[data-reveal]');
    if (REDUCED) return;
    const tweens = els.map((el) =>
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    );
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => tweens.forEach((t) => t.kill());
  }, []);

  return (
    <>
      <HeroField agentOpen={open} />
      <Nav />
      <main className="page">
        <Hero />
        <Convergence />
        <Modules />
        <Pricing />
        <AgentSection />
        <QuoteForm />
        <Faq />
        <Footer />
      </main>
      <DockedPill />
      <AgentPanel />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

export default function App() {
  return (
    <AgentProvider>
      <Shell />
    </AgentProvider>
  );
}
