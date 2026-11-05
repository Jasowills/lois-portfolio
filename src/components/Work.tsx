// Selected work (DESIGN_SPEC 5.1-5.6, 12, 13): plaid section with the six
// verbatim project cards in two columns of 644px, then the orange archive
// button. Card image slots are the exact #c9c9c9 Figma canvas fill until
// covers ship (OPEN_QUESTIONS 19), matching the reference export.
//
// Stroke geometry note (same as Hero, OPEN_QUESTIONS 30): Figma strokes are
// centered on the outline, and a parent element's border paints BELOW its
// children, so the card's 1px black stroke is a transparent child painted on
// top of everything via absolute positioning instead of a `border` on the
// article itself.
//
// Hover (MOTION_SPEC 5.3): the "View Project" button peels in at the
// bottom-left of the IMAGE, never changing the card height; hidden at rest,
// revealed on hover and on keyboard focus. The article click navigates to the
// portfolio home until per-project case-study URLs exist (OPEN_QUESTIONS 32);
// the whole card is clickable through the title link's stretched pseudo.

import type { CSSProperties } from 'react';
import projectsJson from '../data/projects.json';
import { Button } from './ui/Button';
import { StickerLabel } from './ui/StickerLabel';
import { SectionEdge } from './SectionEdge';
import { Verified } from './svg/Verified';

const SPEC = {
  padTop: '76px', // 5.2: sticker label at y=76
  padBottom: '64px',
  gapLabelToH2: '37.9px', // 5.2: H2 top y=149.9 minus label bottom y=112
  cardGap: '24px', // 5.3 grid gap; card-internal vertical gap
  imgAspect: '644 / 356' as const, // 5.4 (12 mobile keeps the ratio)
  radius: 'var(--r-card)',
} as const;

type Project = (typeof projectsJson.projects)[number];

/* Title type per 5.5 (verbatim table). */
function titleStyle(font: string): CSSProperties {
  if (font === 'Blauer Nue 700') return { fontFamily: 'var(--ff-ink)', fontWeight: 700 };
  if (font === 'Blauer Nue 600') return { fontFamily: 'var(--ff-ink)', fontWeight: 600 };
  return { fontFamily: 'var(--ff-outfit)', fontWeight: 400 }; // Outfit 400
}

// Per-card heights, verbatim from DESIGN_SPEC 5.5 (they include ~2px of
// hand-set breathing room on D and E); applied only at 900px and wider.
const CARD_MIN_H = ['674px', '642px', '674px', '676px', '644px', '642px'] as const; // A-F

function WorkCard({ project, cardMinH }: { project: Project; cardMinH: string }) {
  const href = 'https://trulylois.work';
  return (
    <article
      data-accent={project.accent}
      data-cursor="view"
      aria-label={project.title}
      className="group relative flex w-full flex-col items-stretch overflow-hidden min-[900px]:min-h-[var(--card-min-h)]"
      style={{
        background: 'var(--card)',
        borderRadius: SPEC.radius,
        rowGap: '48px', // 5.4: gap between image and body
        ['--card-min-h' as string]: cardMinH,
      }}
    >
      {/* Image slot: placeholder solid until real covers land */}
      <div
        className="relative w-full shrink-0"
        style={{
          aspectRatio: SPEC.imgAspect,
          background: 'var(--image-placeholder)',
          borderRadius: '0 0 var(--r-card) var(--r-card)',
        }}
      >
        {/* Hidden reveal CTA (visible on hover / keyboard focus). */}
        <div className="absolute bottom-6 left-6 -translate-x-4 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
          <Button
            label="View Project"
            arrow="up-right"
            strong
            fill="var(--orange-cta)"
            href={href}
            data-cursor="link"
            aria-label={`View project: ${project.title}`}
          />
        </div>
      </div>

      {/* Body */}
      <div
        className="flex flex-col px-5 pb-6 min-[900px]:px-10 min-[900px]:pb-10"
        style={{ gap: SPEC.cardGap }}
      >
        {/* Title row: title 502 wide at (0,0), year right-aligned at x=526 on xl */}
        <div className="relative top-[2px] flex h-[38px] items-center justify-between gap-4">
          <h3
            className="w-full font-ink text-ink text-[26px] min-[900px]:text-[32px]"
            style={{ ...titleStyle(project.titleFont), lineHeight: '38px', letterSpacing: '-0.03em' }}
          >
            <a
              href={href}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </a>
          </h3>
          <span
            className="font-outfit text-[16px] leading-[20px] text-muted xl:absolute xl:left-[526px] xl:top-[9.5px] xl:w-[38px] xl:text-right"
          >
            {project.year}
          </span>
        </div>

        {/* Description */}
        <p
          className="relative top-[2px] font-outfit text-[18px] leading-[26px] text-[var(--ink-soft)] min-[900px]:text-[22px] min-[900px]:leading-[32px]"
          style={{ letterSpacing: '-0.01em' }}
        >
          {project.description}
        </p>

        {/* Tags */}
        <ul aria-label="Tags" className="flex flex-wrap gap-4 min-[1440px]:flex-nowrap">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="flex h-[48px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[32px] bg-tag-pink px-3 font-outfit text-[16px] leading-5 text-sub"
              style={{ letterSpacing: '0.01em' }}
            >
              <Verified />
              <span>{tag}</span>
            </li>
          ))}
        </ul>
        </div>

      {/* Border overlay: 1px stroke inside the box, painted over children */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ border: '1px solid var(--ink)', borderRadius: SPEC.radius }}
      />
    </article>
  );
}

export function Work() {
  const projects = projectsJson.projects;
  return (
    <section
      id="work"
      data-section="work"
      aria-label="Selected work"
      className="relative w-full border-y border-ink px-5 pb-16 pt-[76px] min-[900px]:px-16 min-[1440px]:h-[2572px]"
      style={{
        backgroundColor: 'var(--lav-work)',
        backgroundImage:
          'repeating-linear-gradient(0deg, var(--work-plaid) 0px, var(--work-plaid) 96px, transparent 96px, transparent 174px),' +
          'repeating-linear-gradient(90deg, var(--work-plaid) 0px, var(--work-plaid) 90px, transparent 90px, transparent 165px)',
      }}
    >
      <SectionEdge variant="tear" from="var(--cream-hero)" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center">
        <StickerLabel
          label="Selected work"
          fill="var(--yellow)"
          rotate={2.81}
          className="flex h-9 items-center"
          data-depth="0.4"
        />
        <h2
          data-skew
          data-split="lines"
          className="relative top-[2px] mt-[34px] w-full max-w-[1055px] text-center font-ink font-semibold text-[28px] leading-[34px] text-[var(--ink-strong)] min-[900px]:text-[45px] min-[900px]:leading-[50px]"
          style={{ letterSpacing: '-0.03em' }}
        >
          A little bit of everything. Very much on purpose.
        </h2>
        <p
          data-split="words"
          className="relative top-[2px] mt-7 w-full max-w-[1003px] text-center font-outfit text-[18px] leading-[28px] text-sub min-[900px]:text-[24px] min-[900px]:leading-[30.24px]"
          style={{ letterSpacing: '-0.01em' }}
        >
          A selection of brand worlds, campaigns and digital work I've helped bring to life. Different briefs, different hats, same love for a good idea.
        </p>

        <div
          data-skew
          className="mt-[60px] grid w-full max-w-[1312px] grid-cols-1 items-start gap-6 min-[900px]:grid-cols-2"
        >
          {projects.map((project, index) => (
            <WorkCard key={project.id} project={project} cardMinH={CARD_MIN_H[index]} />
          ))}
        </div>

        <Button
          label="More from the portfolio"
          arrow="up-right"
          fill="var(--orange)"
          href="https://trulylois.work"
          className="mt-[60px]"
          aria-label="More from the portfolio"
        />
      </div>
    </section>
  );
}
