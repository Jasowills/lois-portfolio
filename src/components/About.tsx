// About (DESIGN_SPEC 8, 12, 13): the split section with the yellow stripe
// field + tilted image cards on the left half, and the sticker / H2 / bio /
// CTA on the right half.
//
// Left half (720 wide, full height): vertical stripes alternating
// #fef5b6 / #fbf1a8, ~47px bands with soft 5px gradient edges, 1px black right
// border. Padding 64px 52px 64px 72px. Two tilted image cards, true size
// 593x397.5, radius 36, 1px black stroke, overflow hidden: card 1 rotated -3.32
// (unrotated top-left (73, 65.05), center (369.5, 263.8)), card 2 rotated +1.64
// (unrotated top-left (73, 505.75), center (369.5, 704.5)). Cloud sticker badges
// counter-rotated against the cards at rot +3.32 fill #f5e8ec and rot -15.12
// fill #ff9c39. Images are the #fafafa checker placeholder until Lois supplies
// portraits (OPEN_QUESTIONS 19).

import type { CSSProperties } from 'react';
import { StickerLabel } from './ui/StickerLabel';
import { Button } from './ui/Button';
import { Logo } from './svg/Logo';

// Stripe field: repeating period 94px (47px bands), soft ramps of 5px at each
// band edge. Stops: #fef5b6 0, hold to 42px, ramp to #fbf1a8 at 47px, hold to
// 89px, ramp back to #fef5b6 at 94px (repeating period 94px).
const STRIPES =
  'repeating-linear-gradient(to right, #fef5b6 0, #fef5b6 42px, #fbf1a8 47px, #fbf1a8 89px, #fef5b6 94px)';

const CHECKER_BG =
  'conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%, var(--card-check-b) 50% 75%, var(--card-check-a) 75%) 0.5px 0.5px / 48px 48px';

const ABOUT_PARAS = [
  "I'm Lois Amadi, a brand and visual designer with a soft spot for thoughtful ideas and the details that make them stick. I work across brand identity, campaign and marketing design, and digital content, bringing strategy and visuals into the same room (they get along better than you'd think).",
  "My experience spans consumer brands, creative projects and tech teams. I've shaped brand and content work, designed for digital channels, and helped turn big piles of information into clear, engaging stories.",
  "I started in fashion, so I'll always care about the details. When I'm not designing, I'm probably sewing something, watching a K-drama, or mentally redesigning a sign I passed on the way here.",
];

// Exact geometry from DESIGN_SPEC section 8 (px, section-local).
const SPEC = {
  sectionH: '969px', // 8: 968.2 -> 969 (integer-height contract, OPEN_QUESTIONS 35)
  leftH: '969px',
  rightH: '969px',
  card: {
    w: '593px', // 8: true size 593x397.5
    h: '397.5px',
    rad: '36px', // 8: radius 36
    stroke: '1px solid var(--ink)',
  },
  card1: { left: '73px', top: '65.05px', rot: '-3.32deg' }, // 8: unrot top-left (73,65.05), center (369.5,263.8)
  card2: { left: '73px', top: '505.75px', rot: '+1.64deg' }, // 8: unrot top-left (73,505.75), center (369.5,704.5)
  badge: [
    { // 8.1 badge 1: top-right of card 1, rot +3.32, fill #f5e8ec, true size 101.8x50.1
      fill: '#f5e8ec',
      left: '575.1px', // 8: unrot badge top-left in section coords
      top: '32.72px',
      w: '101.8px',
      h: '50.1px',
      rot: '+3.32deg',
    },
    { // 8.1 badge 2: top-left of card 2, rot -15.12, fill #ff9c39, true size 104.3x53.5
      fill: '#ff9c39',
      left: '68.95px', // 8: unrot badge top-left in section coords
      top: '493.45px',
      w: '104.3px',
      h: '53.5px',
      rot: '-15.12deg',
    },
  ],
  rightPadT: '76px',
  rightPadB: '64px',
  rightPadL: '52px',
  rightPadR: '72px',
  contentX: '772px',
  contentW: '596px',
  sticker: { text: 'About', rotate: -5.4, fill: 'var(--lime)', w: '68px', h: '36px', top: '76px', left: '772px' },
  h2: { text: "Hi, I'm Lois. I make the thinking visible.", fs: '45px', lh: '50px', ls: '-0.03em', color: 'var(--heading)', top: '150.2px', left: '772px', w: '596px', h: '100px' },
  bio: { top: '282.2px', h: '512px', fs: '24px', lh: '32px', ls: '-0.02em', color: 'var(--body)' },
  btn: { label: 'A little more about me', arrow: 'up-right', fill: 'var(--orange-cta)', top: '846.2px', left: '772px', w: '252px', h: '58px' },
} as const;

function CardImage() {
  // The placeholder checker is design content (DESIGN_SPEC 8.1: #fafafa
  // checker placeholder), not photography, so it is not masked; only real
  // project photography would carry data-diff-ignore.
  return <div style={{ position: 'absolute', inset: 0, background: CHECKER_BG }} />;
}

export function About() {
  return (
    <section
      data-section="about"
      id="about"
      aria-label="About"
      className="about-section relative w-full overflow-hidden"
      style={{ height: '969px' }}
    >
      {/* 8.1 Left half: yellow stripe field with 1px black right border. */}
      <div
        className="about-left"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '720px',
          height: '969px',
          background: STRIPES,
          borderRight: '1px solid var(--ink)',
        }}
      >
        {/* content context for the left half (children use absolute coords) */}
        <div className="about-left-canvas" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* 8.1 card 1: rot -3.32, unrot top-left (73, 65.05) */}
          <div
            className="about-card"
            style={{
              position: 'absolute',
              left: '73px',
              top: '65.05px',
              width: '593px',
              height: '397.5px',
              border: '1px solid var(--ink)',
              borderRadius: '36px',
              overflow: 'hidden',
              transform: 'rotate(-3.32deg)',
              transformOrigin: 'center center',
            }}
          >
            <CardImage />
          </div>
          {/* 8.1 card 2: rot +1.64, unrot top-left (73, 505.75) */}
          <div
            className="about-card"
            style={{
              position: 'absolute',
              left: '73px',
              top: '505.75px',
              width: '593px',
              height: '397.5px',
              border: '1px solid var(--ink)',
              borderRadius: '36px',
              overflow: 'hidden',
              transform: 'rotate(1.64deg)',
              transformOrigin: 'center center',
            }}
          >
            <CardImage />
          </div>

          {/* 8.1 cloud sticker badges, counter-rotated against their card. */}
          {SPEC.badge.map((b, i) => (
            <div
              key={i}
              className="about-badge"
              style={{
                position: 'absolute',
                left: b.left,
                top: b.top,
                width: b.w,
                height: b.h,
                transform: `rotate(${b.rot})`,
              }}
            >
              <div
                style={
                  {
                    width: '100%',
                    height: '100%',
                    background: b.fill,
                    borderRadius: '48%',
                    boxShadow: '2px 2px 0 0 var(--logo-shadow)',
                    '--yellow': b.fill,
                  } as CSSProperties & { '--yellow': string }
                }
              >
                <Logo
                  variant="nav"
                  aria-hidden="true"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8.2 Right half: bg #fffefe. */}
      <div
        className="about-right"
        style={{
          position: 'absolute',
          left: '720px',
          top: 0,
          width: '720px',
          height: '969px',
          background: '#fffefe',
        }}
      >
        {/* content context for the right half (children use absolute coords) */}
        <div className="about-right-inner" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* sticker */}
          <div className="about-sticker" style={{ position: 'absolute', top: '76px', left: '52px', width: '68px', height: '36px' }}>
            <StickerLabel label="About" fill="var(--lime)" rotate={-5.4} />
          </div>

          {/* H2 */}
          <h2
            className="about-h2 font-outfit"
            style={{
              position: 'absolute',
              top: '150.2px',
              left: '52px',
              width: '596px',
              height: '100px',
              fontFamily: 'var(--ff-ink)',
              fontWeight: 600,
              fontSize: '45px',
              lineHeight: '50px',
              letterSpacing: '-0.03em',
              color: 'var(--heading)',
            }}
          >
            {SPEC.h2.text}
          </h2>

          {/* bio */}
          <div className="about-bio" style={{ position: 'absolute', top: '282.2px', left: '52px', width: '596px', height: '512px' }}>
            {ABOUT_PARAS.map((p, i) => (
              <p
                key={i}
                style={{
                  margin: i === 0 ? 0 : '32px 0 0 0',
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.02em',
                  color: 'var(--body)',
                }}
              >
                {p}
              </p>
            ))}
          </div>

          {/* button */}
          <div className="about-btn" style={{ position: 'absolute', top: '846.2px', left: '52px' }}>
            <Button
              label="A little more about me"
              arrow="up-right"
              fill="var(--orange-cta)"
              href="#contact"
              className="w-[252px]"
              aria-label="A little more about me"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
