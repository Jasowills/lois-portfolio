// Navigation, DESIGN_SPEC section 3 exactly: announcement banner 55px
// (#1a160c, Roboto Mono 400 16/23.2 ls -1.12, bold link to #contact) and the
// 115.1px header (bg #fffef9, bottom border 1px #2b2b2b, padding 0 84px /
// 20 vertical, three columns gap 96: right-aligned pills, centered logo
// 140.3x75.1, left-aligned pills). Pill anatomy per 3.2: height 47, padding
// 12px 20px, 1px black border, radius 24, text Outfit 400 (Services 500)
// 16/23.2 ls -0.32, exact widths from the table, arrow only on Contact.
// Mobile per DESIGN_SPEC 12: banner shrinks to 14px, header becomes logo left
// plus a Menu pill that opens a full-screen sheet of the four pills as large
// tilted stickers plus the purple Let's Talk! button (static version).

import { useState } from 'react';
import { Logo } from './svg/Logo';
import { ArrowRight } from './svg/ArrowRight';

/* Exact geometry, verbatim from DESIGN_SPEC 1.2 (type), 3.1 (banner), 3.2
   (header and pills) and 1.3 (nav pill radius). Sizes are px at 1440. */
const SPEC = {
  banner: {
    height: '55px',
    padX: '16px',
    fontSizeToken: 'var(--fs-banner)', // 16px desktop, 14px below 768 (DESIGN_SPEC 12)
    lineHeight: '23.2px',
    lsEm: '-0.07em', // -1.12px at 16px
    gapPx: '8px',
    leftW: '146px', // 3.1: "146 + 8 + 135 wide"
    emojiSize: '14px', // 3.1: Figma sets the heart at 0.875em (ref ink 15x14, advance 16.3)
  },
  header: {
    height: '115.1px',
    padX: '84px',
    padXFluid: 'clamp(20px, 5.8333vw, 84px)', // 84px at 1440, DESIGN_SPEC 12
    padY: '20px',
    colsGap: '96px',
    groupGap: '28px',
    logoW: '140.3px',
    logoH: '75.1px',
  },
  pill: {
    height: '47px',
    padX: '20px',
    padY: '12px',
    radiusVar: 'var(--r-pill)',
    fontSize: '16px',
    lineHeight: '23.2px',
    lsEm: '-0.02em', // -0.32px at 16px
    groupGap: '28px',
  },
  /* Pill widths from the 3.2 table. Contact already includes icon 24 + gap 4. */
  widths: { services: '97px', work: '78px', about: '83px', contact: '124px' } as const,
  /* Mobile sheet, derived from DESIGN_SPEC 12 (no mobile art exists):
     large stickers reuse the hero card tilts; purple CTA per 3.2 note. */
  sheet: {
    fontSize: '24px',
    lineHeight: '28.8px',
    padX: '28px',
    padY: '16px',
    gap: '24px',
    talkW: '128px', // Let's Talk!, exact from 3.2
    talkH: '58px',
    talkFontSize: '18px', // Outfit 600 18 (DESIGN_SPEC 3.2 note)
  },
  /* The Figma frame is 170.1 tall, the 1x export raster is 171 rows, and the
     bottom border ink covers rows 169 AND 170 (ref: 69 at 169, 40 at 170).
     Reserving the 171st row is what lets the border bar (below) paint it
     without being clipped by the element bounds. */
  section: { height: '171px' },
} as const;

type PillData = {
  label: string;
  href: string;
  width: string;
  fill: string;
  weight: 400 | 500;
  arrow?: boolean;
};

const PILLS = {
  services: { label: 'Services', href: '#services', width: SPEC.widths.services, fill: 'var(--blue)', weight: 500 },
  work: { label: 'Work', href: '#work', width: SPEC.widths.work, fill: 'var(--pink)', weight: 400 },
  about: { label: 'About', href: '#about', width: SPEC.widths.about, fill: 'var(--green-pill)', weight: 400 },
  contact: { label: 'Contact', href: '#contact', width: SPEC.widths.contact, fill: 'var(--lav)', weight: 400, arrow: true },
} as const satisfies Record<string, PillData>;

const labelStyle = {
  fontFamily: 'var(--ff-outfit)',
  color: 'var(--ink)',
  whiteSpace: 'nowrap',
} as const;

function Pill({ pill, rotate, big, onClick }: { pill: PillData; rotate?: number; big?: boolean; onClick?: () => void }) {
  const box = {
    width: big ? undefined : pill.width,
    height: big ? undefined : SPEC.pill.height,
    paddingInline: big ? SPEC.sheet.padX : SPEC.pill.padX,
    paddingBlock: big ? SPEC.sheet.padY : SPEC.pill.padY,
    borderRadius: SPEC.pill.radiusVar,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ink)',
    background: pill.fill,
    gap: '4px',
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
  } as const;
  const text = {
    ...labelStyle,
    fontSize: big ? SPEC.sheet.fontSize : SPEC.pill.fontSize,
    lineHeight: big ? SPEC.sheet.lineHeight : SPEC.pill.lineHeight,
    letterSpacing: SPEC.pill.lsEm,
    fontWeight: pill.weight,
  } as const;
  return (
    <a
      href={pill.href}
      onClick={onClick}
      className="inline-flex items-center justify-center border whitespace-nowrap"
      style={box}
    >
      <span style={text}>{pill.label}</span>
      {/* The Contact arrow renders black like the label (per reference
          01-navigation.png; the white fills seen on some Figma arrow
          instances are hidden hover duplicates). */}
      {pill.arrow ? <ArrowRight /> : null}
    </a>
  );
}

/* Derived mobile sheet (static, DESIGN_SPEC 12). Tilts reuse the hero deck. */
const SHEET_TILTS = { services: -5.54, work: 6.69, about: -3.56, contact: 4.96 } as const;

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div id="mobile-menu" className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-cream" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between">
        <a href="/" aria-label="the lois.og, home">
          <Logo variant="nav" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex items-center justify-center border"
          style={{
            height: SPEC.pill.height,
            paddingInline: SPEC.pill.padX,
            paddingBlock: SPEC.pill.padY,
            borderRadius: SPEC.pill.radiusVar,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--ink)',
            background: 'var(--pink-soft)',
          }}
        >
          <span style={{ ...labelStyle, fontSize: SPEC.pill.fontSize, lineHeight: SPEC.pill.lineHeight, letterSpacing: SPEC.pill.lsEm }}>Close</span>
        </button>
      </div>
      <nav aria-label="Mobile" className="mt-16 flex flex-col items-center" style={{ gap: SPEC.sheet.gap }}>
        {(Object.keys(PILLS) as Array<keyof typeof PILLS>).map((key) => (
          <Pill key={key} pill={PILLS[key]} big rotate={SHEET_TILTS[key]} onClick={onClose} />
        ))}
        {/* Let's Talk!, reserved for the mobile menu CTA (DESIGN_SPEC 3.2) */}
        <a
          href="#contact"
          onClick={onClose}
          className="mt-10 inline-flex items-center justify-center"
          style={{
            width: SPEC.sheet.talkW,
            height: SPEC.sheet.talkH,
            background: 'var(--purple)',
            borderRadius: SPEC.pill.radiusVar,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ff-outfit)',
              fontWeight: 600,
              fontSize: SPEC.sheet.talkFontSize, // Outfit 600 18 per 3.2
              lineHeight: SPEC.pill.lineHeight,
              color: 'var(--cream)',
            }}
          >
            Let's Talk!
          </span>
        </a>
      </nav>
    </div>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header data-section="nav" className="relative w-full bg-cream" style={{ height: SPEC.section.height }}>
      {/* 3.1 Announcement banner */}
      <div
        className="flex items-center justify-center"
        style={{
          height: SPEC.banner.height,
          background: 'var(--ink-warm)',
          paddingInline: SPEC.banner.padX,
        }}
      >
        <p
          className="flex items-baseline text-center"
          style={{
            position: 'relative',
            top: '1px', // Chrome centers the 23.2px line 1px above Figma's raster (ref ink rows 20-34)
            gap: SPEC.banner.gapPx,
            fontFamily: 'var(--ff-roboto-mono), "Noto Heart"',
            fontSize: SPEC.banner.fontSizeToken,
            lineHeight: SPEC.banner.lineHeight,
            letterSpacing: SPEC.banner.lsEm,
            color: 'var(--cream)',
          }}
        >
          <span style={{ width: SPEC.banner.leftW }}>Available to work </span>
          <a href="#contact" style={{ fontWeight: 700, textDecoration: 'none' }}>
            Get in touch!{' '}
            <span style={{ fontSize: SPEC.banner.emojiSize }}>🩵</span>
          </a>
        </p>
      </div>

      {/* 3.2 Header, exact desktop layout at 1280+ (three columns, gap 96) */}
      <nav aria-label="Primary" className="relative hidden xl:block">
        <div
          className="grid w-full items-center"
          style={{
            height: SPEC.header.height,
            paddingInline: SPEC.header.padX,
            paddingBlock: SPEC.header.padY,
            gridTemplateColumns: '1fr max-content 1fr',
            columnGap: SPEC.header.colsGap,
          }}
        >
          <div className="flex items-center justify-end" style={{ gap: SPEC.header.groupGap }}>
            <Pill pill={PILLS.services} />
            <Pill pill={PILLS.work} />
          </div>
          <a href="/" aria-label="the lois.og, home" className="block">
            <Logo variant="nav" width={SPEC.header.logoW} height={SPEC.header.logoH} data-nav-logo />
          </a>
          <div className="flex items-center justify-start" style={{ gap: SPEC.header.groupGap }}>
            <Pill pill={PILLS.about} />
            <Pill pill={PILLS.contact} />
          </div>
        </div>
        {/* 3.2 bottom border 1px #2b2b2b. At 1x the Figma export rasterizes it
            across rows 169 (partial) + 170 (full), i.e. centered ~0.55px lower
            than border-box placement inside the 115.1 header, so it is drawn
            here absolutely (2px bar from calc(100% - 1.1px)) to sit on the same
            device rows without touching layout. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0"
          style={{ top: 'calc(100% - 1.1px)', height: '2px', background: 'var(--dark-2)' }}
        />
      </nav>

      {/* Derived mobile header below 1280: logo left, Menu pill right */}
      <nav aria-label="Primary mobile" className="block xl:hidden">
        <div
          className="flex w-full items-center justify-between"
          style={{
            height: SPEC.header.height,
            paddingInline: SPEC.header.padXFluid,
            paddingBlock: SPEC.header.padY,
            borderBottom: '1px solid var(--dark-2)',
          }}
        >
          <a href="/" aria-label="the lois.og, home" className="block">
            <Logo variant="nav" width={SPEC.header.logoW} height={SPEC.header.logoH} data-nav-logo />
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex items-center justify-center border"
            style={{
              height: SPEC.pill.height,
              paddingInline: SPEC.pill.padX,
              paddingBlock: SPEC.pill.padY,
              borderRadius: SPEC.pill.radiusVar,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--ink)',
              background: 'var(--pink-soft)',
            }}
          >
            <span style={{ ...labelStyle, fontSize: SPEC.pill.fontSize, lineHeight: SPEC.pill.lineHeight, letterSpacing: SPEC.pill.lsEm }}>Menu</span>
          </button>
        </div>
      </nav>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
