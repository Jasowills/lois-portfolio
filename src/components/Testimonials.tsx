// Testimonials (DESIGN_SPEC 9, 12, 13): the cream-white bordered section with
// the "Kind words" sticker, the Blauer Nue H2 and the two quote cards.
//
// Section (1440 x 819.4): bg #fffefe (bg-cream-white), 1px black border top and
// bottom (framed in App), padding 76px 72px 64px, content 1296 wide at x=72,
// left aligned. Sticker at (72, 76) rot +3.96, H2 box (72, 153.4) 652x100, two
// cards at y=313.4, each 618x442 at x=72 and x=750, bg #deedfa (var --blue),
// border 1px black, radius 36, padding 40px 32px.

import data from '../data/testimonials.json';
import { useStaticMode } from '../motion/useStaticMode';
import { StickerLabel } from './ui/StickerLabel';

const CHECKER_BG =
  'conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%, var(--card-check-b) 50% 75%, var(--card-check-a) 75%) 0.5px 0.5px / 48px 48px';

// Exact Figma text for both cards (DESIGN_SPEC 9.3: build-as version, placeholder
// until real testimonials exist). Static mode renders this for the visual diff.
const FIGMA_QUOTE = "When I’m not designing, I’m probably sewing something cute, blasting K-pop or neo-soul (Olivia Dean supremacy 😭), or mentally redesigning every poster I walk past.";
const FIGMA_ATTRIBUTION = '-Alyssa, @femfounderstudio';

export function Testimonials() {
  const staticMode = useStaticMode();

  const cards = data.cards.map((card, i) => ({
    key: i,
    quote: staticMode || card.todoContent ? FIGMA_QUOTE : card.quote,
    attribution: staticMode || card.todoContent ? FIGMA_ATTRIBUTION : card.attribution,
  }));

  return (
    <section
      data-section="testimonials"
      id="testimonials"
      aria-label="Testimonials"
      className="relative w-full bg-cream-white border-y border-ink"
      style={{ height: '821px' }}
    >
      <div style={{ position: 'absolute', top: '76px', left: '72px', right: '72px', bottom: '64px' }}>
        {/* Sticker, left aligned at x=72, y=76, rot +3.96. */}
        <div style={{ position: 'absolute', top: '76px', left: '72px', width: '137px', height: '36px' }}>
          <StickerLabel label="Kind words" fill="var(--lime)" rotate={3.96} />
        </div>

        {/* H2, box 652x100 at (72, 153.4), two lines, Blauer Nue 600 45/50 ls -1.35. */}
        <h2
          style={{
            position: 'absolute',
            top: '153.4px',
            left: '72px',
            width: '652px',
            height: '100px',
            fontFamily: 'var(--ff-ink)',
            fontWeight: 600,
            fontSize: '45px',
            lineHeight: '50px',
            letterSpacing: '-0.03em',
            color: 'var(--heading)',
          }}
        >
          Trusted by amazing people and teams across the globe.
        </h2>

        {/* Quote cards. */}
        {cards.map((c) => (
          <div
            key={c.key}
            style={{
              position: 'absolute',
              top: '313.4px',
              left: c.key === 0 ? '72px' : '750px',
              width: '618px',
              height: '442px',
              background: 'var(--blue)',
              border: '1px solid var(--ink)',
              borderRadius: '36px',
              overflow: 'hidden',
            }}
          >
            {/* Avatar: 144x129, radius 24, 1px stroke, centered (x offset 205). */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '237px',
                width: '144px',
                height: '129px',
                borderRadius: '24px',
                border: '1px solid var(--ink)',
                background: CHECKER_BG,
              }}
            />
            {/* Quote: 554x128, Outfit 400 24/32 ls -0.48. */}
            <div style={{ position: 'absolute', top: '205px', left: '32px', width: '554px', height: '128px', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.02em',
                  color: 'var(--body)',
                }}
              >
                {c.quote}
              </p>
            </div>
            {/* Attribution: Outfit 500 28/44.6 ls -0.54. */}
            <div style={{ position: 'absolute', top: '369px', left: '32px', width: '554px', height: '44.6px', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 500,
                  fontSize: '28px',
                  lineHeight: '44.6px',
                  letterSpacing: '-0.0193em',
                  color: 'var(--heading)',
                }}
              >
                {c.attribution}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
