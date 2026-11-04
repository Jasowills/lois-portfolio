import clsx from 'clsx';
import { MotionProvider } from './motion/MotionProvider';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Work } from './components/Work';
import { Experience } from './components/Experience';

/**
 * Phase 0 page shell: nine empty section roots in the exact order, heights
 * (px at 1440), backgrounds and section borders of DESIGN_SPEC section 0.
 * Section internals land in phases 2 to 10 (OPENCODE_PROMPTS.md).
 */

/** Section heights, in exact integer pixels at 1440. The Figma frames carry
    fractional heights (e.g. hero 865.9), but the exported reference rasters are
    integer rows (hero 866), and Chrome rasterizes a fractional-top element by
    rounding its clip upward. Heights here ceil the spec values so every
    section's top lands on an integer pixel row. Values rounded per row and
    cross-checked against the reference PNGs (see OPEN_QUESTIONS 35). */
const SPEC = {
  nav: '171px',
  hero: '866px',
  experience: '780px',
  services: '1226px',
  about: '969px',
  testimonials: '820px',
  cta: '830px',
  footer: '716px',
} as const;

/** Backgrounds. The section-bg-* placeholders are defined in base.css and are
 * replaced by each section's real build in later phases. */
const BG: Record<keyof typeof SPEC, string> = {
  nav: 'section-bg-nav',
  hero: 'bg-cream-hero',
  experience: 'bg-lav-exp',
  services: 'bg-cream',
  about: 'section-bg-about',
  testimonials: 'bg-cream-white',
  cta: 'bg-cta-bg',
  footer: 'section-bg-footer',
};

/** Sections framed by a 1px black top and bottom border (DESIGN_SPEC section 0). */
const BORDERS: ReadonlySet<keyof typeof SPEC> = new Set(['testimonials', 'cta']);

type SectionId = keyof typeof SPEC;

/** Anchor targets used by the nav pills (DESIGN_SPEC 3.2: Services, Work,
    About pills and #contact for Contact; the CTA section doubles as contact). */
const ANCHORS: Partial<Record<SectionId, string>> = {
  services: 'services',
  about: 'about',
  cta: 'contact',
};

function Section({ id }: { id: SectionId }) {
  return (
    <section
      data-section={id}
      id={ANCHORS[id]}
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
      <Nav />
      <main id="main">
        <Hero />
        <Work />
        <Experience />
        <Section id="services" />
        <Section id="about" />
        <Section id="testimonials" />
        <Section id="cta" />
        <Section id="footer" />
      </main>
    </MotionProvider>
  );
}
