// Footer (DESIGN_SPEC 11, 12, 13): dark stripe footer with the logo, social
// row, copyright/credit and the signpost with five HTML signs.
//
// Responsive (DESIGN_SPEC 12): at 1439 and below the section becomes a single
// centered column, the logo scales, and the signpost group moves below the
// copyright with its tilts intact. Desktop keeps the exact absolute geometry.

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
      className="footer-section relative w-full section-bg-footer"
      style={{ height: '716px' }}
    >
      {/* Left column: logo, socials, copyright, credit. Content context inset
          to the section frame; children use section-absolute coords. The
          signpost group also lives here so it can stack below the credit in
          the responsive column layout. */}
      <div className="footer-left" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Logo
          className="footer-logo"
          variant="footer"
          width={506.9}
          height={271.2}
          style={{ position: 'absolute', top: '76px', left: '72px' }}
        />

        {/* Social row at y=412.4. display:contents on desktop keeps each tile
            on its exact absolute x; the responsive column turns this into a
            flex row. */}
        <div className="footer-socials" style={{ display: 'contents' }}>
          {SOCIALS.map((s) => (
            <div
              key={s.id}
              className="footer-social"
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
        </div>

        {/* Copyright at y=530, two lines, Outfit 400 28/35.3, ls -0.56, #fffef3. */}
        <p
          className="footer-copy"
          style={{
            position: 'absolute',
            top: '530px',
            left: '72px',
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
          className="footer-credit"
          style={{
            position: 'absolute',
            top: '624px',
            left: '72px',
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

        {/* Signpost at x=1132, y=76, with five HTML signs. display:contents
            keeps the desktop absolute layout; the responsive column wraps it
            into a 236px-tall centered group below the credit. */}
        <div className="footer-signs" style={{ display: 'contents' }}>
          <div className="footer-signpost" style={{ position: 'absolute', top: '76px', left: '1132px', width: '236px' }}>
            <Signpost />
          </div>
          {SIGNS.map((s) => (
            <div
              key={s.label}
              className="footer-sign"
              style={{
                ['--sign-y' as string]: s.y,
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
                  className="footer-sign-label"
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
      </div>
    </section>
  );
}
