// Footer (DESIGN_SPEC 11, 12, 13): dark stripe footer with the logo, social
// row, copyright/credit and the signpost with five HTML signs.

import { Logo } from './svg/Logo';
import { Signpost } from './svg/Signpost';
import { LinkedIn } from './svg/LinkedIn';
import { Mail } from './svg/Mail';

const COPYRIGHT = ' © 2026 Lois Amadi. All rights reserved, all wrongs forgiven... eventually. No pixels were harmed in the making of this site.';
const CREDIT = 'Designed by me. Tweaked approximately a thousand times.';

const SOCIALS = [
  { id: 'linkedin', x: '72px', bg: '#dbbcff', glyph: <LinkedIn /> },
  { id: 'mail-1', x: '146px', bg: '#fbd4e6', glyph: <Mail /> },
  { id: 'mail-2', x: '220.1px', bg: '#fef5b6', glyph: <Mail /> },
  { id: 'mail-3', x: '294.1px', bg: '#bed35a', glyph: <Mail /> },
] as const;

const SIGNS = [
  { label: 'Back to Top', fill: '#ff8c42', rot: '0deg', y: '160.8px', font: 'var(--ff-ink)' },
  { label: 'About', fill: '#dbbcff', rot: '-5.17deg', y: '237.8px', font: 'var(--ff-outfit)' },
  { label: 'Work', fill: '#cff5ff', rot: '+5.15deg', y: '335.7px', font: 'var(--ff-outfit)' },
  { label: 'Services', fill: '#fbd4e6', rot: '-3.15deg', y: '433.6px', font: 'var(--ff-ink)' },
  { label: 'Get in Touch', fill: '#fef5b6', rot: '+2.05deg', y: '522.8px', font: 'var(--ff-ink)' },
] as const;

export function Footer() {
  return (
    <section
      data-section="footer"
      id="footer"
      aria-label="Footer"
      className="relative w-full section-bg-footer"
      style={{ height: '716px' }}
    >
      {/* Left column: logo, socials, copyright, credit. */}
      <div style={{ position: 'absolute', top: '76px', left: '72px', width: '1060px' }}>
        <Logo variant="footer" width={506.9} height={271.2} />

        {/* Social row at y=412.4. */}
        {SOCIALS.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              top: '412.4px',
              left: s.x,
              width: '59.8px',
              height: '52.4px',
              background: s.bg,
              borderRadius: '5.69px',
            }}
          >
            <div style={{ position: 'absolute', inset: '11.4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--ink)', display: 'inline-flex' }}>{s.glyph}</span>
            </div>
          </div>
        ))}

        {/* Copyright at y=530, two lines, Outfit 400 28/35.3, ls -0.56, #fffef3. */}
        <p
          style={{
            position: 'absolute',
            top: '530px',
            left: 0,
            width: '847px',
            fontFamily: 'var(--ff-outfit)',
            fontWeight: 400,
            fontSize: '28px',
            lineHeight: '35.3px',
            letterSpacing: '-0.02em',
            color: 'var(--footer-text)',
          }}
        >
          {COPYRIGHT}
        </p>

        {/* Credit at y=624, Outfit 400 22/27.7, ls -0.44, #cccccc. */}
        <p
          style={{
            position: 'absolute',
            top: '624px',
            left: 0,
            fontFamily: 'var(--ff-outfit)',
            fontWeight: 400,
            fontSize: '22px',
            lineHeight: '27.7px',
            letterSpacing: '-0.02em',
            color: 'var(--footer-sub)',
          }}
        >
          {CREDIT}
        </p>
      </div>

      {/* Signpost at x=1132, y=76, with five HTML signs. */}
      <div style={{ position: 'absolute', top: '76px', left: '1132px', width: '236px' }}>
        <Signpost />
        {SIGNS.map((s) => (
          <div
            key={s.label}
            style={{
              position: 'absolute',
              top: s.y,
              left: '1138px',
              width: '224px',
              height: '61px',
              border: '1px solid var(--ink)',
              borderRadius: '8px',
              background: s.fill,
              transform: `rotate(${s.rot})`,
            }}
          >
            <div style={{ position: 'absolute', inset: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: s.font,
                  fontWeight: s.font === 'var(--ff-ink)' ? 500 : 400,
                  fontSize: '24px',
                  lineHeight: '28.8px',
                  color: 'var(--ink)',
                  textAlign: 'center',
                }}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
