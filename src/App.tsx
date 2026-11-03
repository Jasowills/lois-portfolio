import clsx from 'clsx';
import { MotionProvider } from './motion/MotionProvider';
import { Logo } from './components/svg/Logo';
import { Signpost } from './components/svg/Signpost';
import { CtaBlob } from './components/svg/CtaBlob';
import { Verified } from './components/svg/Verified';
import { ArrowRight } from './components/svg/ArrowRight';
import { ArrowUpRight } from './components/svg/ArrowUpRight';
import { LinkedIn } from './components/svg/LinkedIn';
import { Mail } from './components/svg/Mail';

/**
 * Phase 0 page shell: nine empty section roots in the exact order, heights
 * (px at 1440), backgrounds and section borders of DESIGN_SPEC section 0.
 * Section internals land in phases 2 to 10 (OPENCODE_PROMPTS.md).
 */

/** Section heights, verbatim from DESIGN_SPEC section 0. */
const SPEC = {
  nav: '170.1px',
  hero: '865.9px',
  work: '2571.9px',
  experience: '780px',
  services: '1225.9px',
  about: '968.2px',
  testimonials: '819.4px',
  cta: '828.3px',
  footer: '716px',
} as const;

/** Backgrounds. The section-bg-* placeholders are defined in base.css and are
 * replaced by each section's real build in later phases. */
const BG: Record<keyof typeof SPEC, string> = {
  nav: 'section-bg-nav',
  hero: 'bg-cream-hero',
  work: 'bg-lav-work',
  experience: 'bg-lav-exp',
  services: 'bg-cream',
  about: 'section-bg-about',
  testimonials: 'bg-cream-white',
  cta: 'bg-cta-bg',
  footer: 'section-bg-footer',
};

/** Sections framed by a 1px black top and bottom border (DESIGN_SPEC section 0). */
const BORDERS: ReadonlySet<keyof typeof SPEC> = new Set(['work', 'testimonials', 'cta']);

type SectionId = keyof typeof SPEC;

function Section({ id }: { id: SectionId }) {
  return (
    <section
      data-section={id}
      className={clsx(BG[id], BORDERS.has(id) && 'border-y border-ink')}
      style={{ height: SPEC[id] }}
    />
  );
}

export default function App() {
  return (
    <MotionProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* Temporary Phase 1 mount proving the Figma SVG exports work in React
          (display:none so the page renders the exact Phase 0 static design and
          the visual diff stays clean). Removed in Phase 2 as real sections
          replace the empties. */}
      <div aria-hidden="true" style={{ display: 'none' }}>
        <Logo variant="nav" />
        <Logo variant="footer" />
        <Signpost />
        <CtaBlob />
        <Verified />
        <ArrowRight />
        <ArrowUpRight />
        <LinkedIn />
        <Mail />
      </div>
      <header>
        <Section id="nav" />
      </header>
      <main id="main">
        <Section id="hero" />
        <Section id="work" />
        <Section id="experience" />
        <Section id="services" />
        <Section id="about" />
        <Section id="testimonials" />
        <Section id="cta" />
        <Section id="footer" />
      </main>
    </MotionProvider>
  );
}
