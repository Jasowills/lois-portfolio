// CTA (DESIGN_SPEC 10, 12, 13): the #deeab3 blob section with the centered
// headline, paragraph and button, plus the static contact drawer.
//
// Section (1440 x 828.3): bg #deeab3 (bg-cta-bg), 1px black borders top/bottom
// (framed in App), padding 76px 72px 64px. Blob SVG (section 2) fills x 64..1376,
// y 86..754 (1312x668), fill #fffef9 (var --cream), stroke 1px black. Centered
// content: 1312 wide column, text blocks 1055 wide at x=192.5.
//   - H2 "Got a project in mind? Let's talk." Outfit 400 45/50 ls -1.35 #040100,
//     centered, y=298.1.
//   - Paragraph Outfit 400 26/36 ls -0.52 #040100, centered, 1055x72 at y=380.1.
//   - Button "Tell me what you're working on" #fef5b6, 317x58 at x=561.5, y=484.1.
// Block is vertically centered in the blob.

import { useState } from 'react';
import { CtaBlob } from './svg/CtaBlob';
import { Button } from './ui/Button';
import { ContactDrawer } from './ContactDrawer';
import { SectionEdge } from './SectionEdge';

export function CTA() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <section
        data-section="cta"
        id="contact"
        aria-label="Contact"
        className="cta-section relative w-full bg-cta-bg border-y border-ink"
        style={{ height: '830px' }}
      >
        <SectionEdge variant="blob" from="var(--cream-white)" />
        {/* Blob: absolute x 64..1376, y 86..754, 1312x668, overflow visible. */}
        <div className="cta-blob" data-depth="-0.2" style={{ position: 'absolute', top: '86px', left: '64px', width: '1312px', height: '668px', overflow: 'visible' }}>
          <CtaBlob />
        </div>

        {/* Centered content block, vertically centered in the blob. */}
        <div className="cta-content" style={{ position: 'absolute', top: '0px', left: '0px', right: '0px', bottom: '0px' }}>
          {/* Content column: H2 top 298.1, para top 380.1, button top 484.1. */}
          <div className="cta-copy" style={{ position: 'absolute', top: '298.1px', left: '192.5px', width: '1055px', height: '244px' }}>
            {/* H2, box 1055x50 at (192.5, 298.1), centered. */}
            <h2
              data-skew
              className="cta-h2"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1055px',
                height: '50px',
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 400,
                fontSize: '45px',
                lineHeight: '50px',
                letterSpacing: '-0.03em',
                color: 'var(--heading)',
                textAlign: 'center',
              }}
            >
              Got a project in mind? Let's talk.
            </h2>

            {/* Paragraph, box 1055x72 at (192.5, 380.1), centered, two lines. */}
            <p
              className="cta-para"
              style={{
                position: 'absolute',
                top: '80px',
                left: 0,
                width: '1055px',
                height: '72px',
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 400,
                fontSize: '26px',
                lineHeight: '36px',
                letterSpacing: '-0.02em',
                color: 'var(--heading)',
                textAlign: 'center',
              }}
            >
              Tell me what you're building, what's not working yet, or what you need an extra pair of creative hands for. We'll take it from there.
            </p>

            {/* Button, 317x58 at (561.5, 484.1). */}
            <div className="cta-button" style={{ position: 'absolute', top: '184px', left: 0, width: '1055px', height: '58px', display: 'flex', justifyContent: 'center' }}>
              <Button
                label="Tell me what you're working on"
                arrow="up-right"
                fill="var(--yellow)"
                className="w-[317px]"
                onClick={() => setDrawerOpen(true)}
              />
            </div>
          </div>
        </div>
      </section>

      <ContactDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
