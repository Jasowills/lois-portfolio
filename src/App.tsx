import { MotionProvider } from './motion/MotionProvider';
import { Loader } from './components/Loader';
import { Cursor } from './components/Cursor';
import { ScrollFeel } from './components/ScrollFeel';
import { ScrollProgress } from './components/ScrollProgress';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Work } from './components/Work';
import { Experience } from './components/Experience';
import { Services } from './components/Services';
import { About } from './components/About';
import { Testimonials } from './components/Testimonials';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

/**
 * Page shell: the nine real section builds in the exact DESIGN_SPEC order
 * (nav, hero, work, experience, services, about, testimonials, cta, footer).
 * Each section root carries its own data-section, height and background; see
 * DESIGN_SPEC section 0 for the order and frame rules.
 */

export default function App() {
  return (
    <MotionProvider>
      <Loader />
      <Cursor />
      <ScrollFeel />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Work />
        <Experience />
        <Services />
        <About />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
      <ScrollProgress />
    </MotionProvider>
  );
}
