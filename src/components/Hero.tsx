// Hero (DESIGN_SPEC 4.1/4.2, 12, 13): the cream introduction section with the
// two-line H1, the tilted four-card deck, the intro paragraph and the orange
// CTA button. Static render only; motion phases may add over it, never change
// this default state (MOTION_SPEC 0).
//
// Vertical rhythm note: DESIGN_SPEC 4.1 gives the paragraph node as 924x90,
// but the reference raster (`reference/02-hero.png`) shows three text lines at
// exactly 36px pitch (ink rows 601..624, 637..660, 673..691). Three line boxes
// at 36px line-height take 108px, 18px more than the recorded 90px node box:
// the node number is the ink extent, so the deck->paragraph offset is 31px and
// the pre-button margin is 43px, landing the button on the specified y=743.9
// and closing the section at exactly 865.9px. Logged in OPEN_QUESTIONS 29.
//
// Card stroke geometry: Figma strokes are center-aligned, so the visible card
// is the 391x250 frame plus 0.5px of 1px black stroke on every side. The
// rendered border box is therefore 392x251, offset -0.5px, radius 36.5, and the
// checkerboard pattern origin sits at the frame corner (0.5px). Logged in
// OPEN_QUESTIONS 30.

import { Button } from './ui/Button';

/* Exact geometry from the spec (DESIGN_SPEC 4.1 + 4.2 table + 12 hero row).
   Colors and fonts stay in tokens (tokens.css); pattern colors are tokens too. */
const SPEC = {
  // 4.1: content column 1328 wide at x=72 (padding 84 40 64 72), centered on
  // 736. Mobile (12): horizontal page padding 20px, H1 clamp(34px, 9.5vw, 60px)
  // at 1.2 line-height -0.04em, paragraph 18/26, button full width up to 320.
  maxW: '1440px', // 12: center the 1440 column; background full-bleed
  h1: {
    // Raster-derived per-line tracking (OPEN_QUESTIONS 29). Values in em per
    // the px/fontSize rule; the shared -0.04em applies below md.
    ls1: '-0.0183333em', // -1.1px at 60 (ref line 1 ink width 570px)
    ls2: '-0.0416667em', // -2.5px at 60 (ref line 2 ink width 762px)
  },
  h1Gap: 40, // 4.1 gap H1 -> deck
  paraGap: 31, // 4.1 says 40; ink lands on ref row 601 (see header note)
  btnGap: 43, // 4.1: button top y=743.9 (line boxes add 18; see header note)
  deck: {
    h: '293.9px', // 4.2 container height
    top: '21.9px', // 4.2 container-relative top of each unrotated (frame) card
    cardW: 391, // 4.2 true size (the Figma frame the stroke is centered on)
    cardH: 250,
    boxW: 392, // stroke-centered border box (see header note)
    boxH: 251,
    boxDx: -0.5,
    boxDy: -0.5,
    checkPeriod: '48px', // measured raster: 24px squares, two per tile
    cards: [
      // 4.2 table: deck-relative left (of the 391px frame), rotation, z order
      { id: 'garri-granola', left: 11.2, rot: -5.54 },
      { id: 'heure-doree', left: 313.6, rot: 6.69 },
      { id: 'rika-trips', left: 612.2, rot: -3.56 },
      { id: 'africa-built', left: 907.7, rot: 4.96 },
    ],
  },
  btn: { fill: 'var(--orange-hero)' }, // 4.1 + 1.4 button row (186x58)
} as const;

/* The conic tile places the gray square in the top-right and bottom-left
   quadrants, reproducing the reference's 24px checkerboard with the white
   square at each card's local top-left (OPEN_QUESTIONS 28). */
const CHECKER_BG =
  `conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%,` +
  ` var(--card-check-b) 50% 75%, var(--card-check-a) 75%)` +
  ` 0.5px 0.5px / ${SPEC.deck.checkPeriod} ${SPEC.deck.checkPeriod}`;

export function Hero() {
  return (
    <section
      data-section="hero"
      className="relative w-full bg-cream-hero px-5 pt-[64px] pb-16 md:px-10 md:pt-[84px] md:pb-16 md:pl-[72px] min-[1440px]:h-[866px]"
    >
      <div className="mx-auto w-full max-w-[1440px] flex flex-col items-center">
        <div className="flex w-full max-w-[1328px] flex-col items-center">
          {/* 4.1 H1: explicit two lines; one <h1> per page (13). Per-line
              tracking from the reference raster (OPEN_QUESTIONS 29). */}
          <h1 className="text-center font-semibold md:font-semibold font-ink text-ink text-[clamp(34px,9.5vw,60px)] leading-[1.2] tracking-[-0.04em] md:text-[60px] md:leading-[72px] md:tracking-normal">
            <span className="block tracking-[-0.04em] md:tracking-[-0.0183333em]">
              Good work deserves
            </span>
            <span className="block tracking-[-0.04em] md:tracking-[-0.0416667em]">
              a better-looking introduction.
            </span>
          </h1>

          {/* 4.2 Card deck: 1328x293.9 container, four absolutely positioned
              tilted cards, stacking order rises left to right. Decorative
              placeholder raster; real covers expose alt text when they land. */}
          <div
            aria-hidden="true"
            role="presentation"
            className="relative hidden min-[1440px]:block"
            style={{ width: '100%', height: SPEC.deck.h, marginTop: `${SPEC.h1Gap}px` }}
          >
            {SPEC.deck.cards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  position: 'absolute',
                  left: `${card.left + SPEC.deck.boxDx}px`,
                  top: `calc(${SPEC.deck.top} + ${SPEC.deck.boxDy}px)`,
                  width: `${SPEC.deck.boxW}px`,
                  height: `${SPEC.deck.boxH}px`,
                  boxSizing: 'border-box',
                  border: '1px solid var(--ink)',
                  borderRadius: '36.5px',
                  overflow: 'hidden',
                  transform: `rotate(${card.rot}deg)`,
                  zIndex: i + 1,
                  background: CHECKER_BG,
                }}
              />
            ))}
          </div>

          {/* 12 mobile: horizontally scrollable snap-aligned deck, card 78vw
              (capped at 520 on tablet/laptop so it stays a deck), tilts kept,
              12% overlap. Shown below the desktop breakpoint. */}
          <div
            aria-hidden="true"
            role="presentation"
            className="hero-mobile-deck relative w-full overflow-x-auto min-[1440px]:hidden"
            style={{
              /* Height covers the rotated bbox (391*sin(6.69deg) +
                 250*cos(6.69deg) = 293.4px => 0.7519 x cardW), else the
                 corners clip. */
              height: `calc(min(78vw, 520px) * 0.7519 + 64px)`,
              marginTop: `${SPEC.h1Gap}px`,
              scrollSnapType: 'x mandatory',
            }}
          >
            <div className="flex h-full items-center">
              {SPEC.deck.cards.map((card, i) => (
                <div
                  key={card.id}
                  style={{
                    flex: 'none',
                    width: 'min(78vw, 520px)',
                    height: `calc(min(78vw, 520px) * ${SPEC.deck.cardH} / ${SPEC.deck.cardW})`,
                    boxSizing: 'border-box',
                    border: '1px solid var(--ink)',
                    borderRadius: 'var(--r-card)',
                    transform: `rotate(${card.rot}deg)`,
                    scrollSnapAlign: 'center',
                    marginLeft: i === 0 ? 'calc(0.14 * min(78vw, 520px))' : 'calc(-0.12 * min(78vw, 520px))',
                    background: CHECKER_BG,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 4.1 Paragraph: three centered lines */}
          <p
            className="w-full text-center font-outfit text-ink text-[18px] leading-[26px] tracking-[-0.02em] md:max-w-[924px] md:text-[26px] md:leading-[36px]"
            style={{ marginTop: `${SPEC.paraGap}px` }}
          >
            I'm Lois, a brand and visual designer turning good ideas into
            thoughtful identities, useful visuals and brands people remember.
            Strategy brain, design eyes. Very serious about the details.
          </p>

          {/* 4.1 Button at x=643, y=743.9 (centered on the 736 column center) */}
          <div
            className="flex w-full justify-center"
            style={{ marginTop: `${SPEC.btnGap}px` }}
          >
            <Button
              label="See what I do"
              arrow="up-right"
              fill={SPEC.btn.fill}
              href="#work"
              className="max-w-[320px] max-md:w-full"
              aria-label="See what I do"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
