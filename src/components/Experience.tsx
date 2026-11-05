// Experience (DESIGN_SPEC 6, 12 - experience row, 13): the lavender section
// with the editorial "creative hats" heading, four flat role cards and the
// footnote. Static render only; hover/motion phases may add over it.
//
// Vertical rhythm: elements are pinned by their spec y values using the
// 28px vertical gap everywhere (84+17.64+28+51.79+28+22.68+28+370+28+20.16
// leaves the 780px section exactly; spec 6 lists absolute y positions that
// already land on this grid).

import data from '../data/experience.json';
import { SectionEdge } from './SectionEdge';

// Exact values from the spec (DESIGN_SPEC 6). Colors live in tokens.
const SPEC = {
  card: {
    radius: '18px', // 6
    padX: '22px', // 6
    padY: '24px', // 6
    innerGap: '12px', // 6: vertical gap inside the card content
    border: '1px solid var(--exp-card-border)', // 6
  },
} as const;

export function Experience() {
  return (
    <section
      data-section="experience"
      id="experience"
      aria-label="Experience"
      className="experience-section relative w-full bg-lav-exp px-5 pb-20 pt-[84px] min-[1440px]:h-[780px] min-[1440px]:px-[120px] min-[1440px]:pb-0"
    >
      <SectionEdge variant="blob" from="var(--lav-work)" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <p
          className="relative top-[3px] font-outfit text-[14px] uppercase leading-[17.64px] text-[var(--ink-label)]"
        >
          {data.label}
        </p>
        <h2
          data-skew
          className="relative top-[3px] mt-[28px] max-w-full font-fraunces text-[clamp(26px,6.5vw,42px)] leading-[1.2] text-[var(--ink-exp-h2)] min-[1200px]:leading-[51.8px]"
          style={{ fontWeight: 400 }}
        >
          {data.heading}
        </h2>
        <p
          className="relative top-[3px] mt-[28px] max-w-[1100px] font-outfit text-[16px] leading-[22px] text-[var(--ink-intro)] min-[1200px]:text-[18px] min-[1200px]:leading-[22.68px]"
        >
          {data.intro}
        </p>

        {/* 6/12: cards row; horizontal scroll-snap below 900px */}
        <div
          data-cursor="drag"
          className="mt-7 w-full overflow-x-auto min-[1440px]:overflow-visible"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="flex min-w-[1200px] gap-[18px] min-[1440px]:min-w-0" data-skew>
            {data.cards.map((card) => (
              <article
                key={card.title}
                className="exp-card relative flex h-[330px] w-[78vw] shrink-0 flex-col overflow-hidden min-[900px]:w-[282px]"
                style={{
                  scrollSnapAlign: 'start',
                  background: card.fill,
                  borderRadius: SPEC.card.radius,
                  border: SPEC.card.border,
                  padding: `${SPEC.card.padY} ${SPEC.card.padX}`,
                  gap: SPEC.card.innerGap,
                }}
              >
                <h3
                  className="relative top-[3px] font-fraunces text-[24px] leading-[29.59px] text-[var(--ink-exp-h2)]"
                  style={{ fontWeight: 400 }}
                >
                  {card.title}
                </h3>
                <p
                  className="relative top-[3px] font-outfit text-[14px] leading-[17.64px] text-[var(--ink-role)]"
                >
                  {card.role}
                </p>
                <p
                  className="relative top-[3px] font-outfit text-[15px] leading-[18.9px] text-[var(--ink-intro)]"
                >
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <p
          className="relative top-[3px] mt-7 font-outfit text-[16px] leading-[20.16px] text-[var(--ink-intro)]"
        >
          {data.footnote}
        </p>
      </div>
    </section>
  );
}
