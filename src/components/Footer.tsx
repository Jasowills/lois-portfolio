// Footer (DESIGN_SPEC 11, 12, 13): dark stripe footer with the logo, social
// row, copyright/credit and the signpost with five HTML signs.
//
// Responsive (DESIGN_SPEC 12): at 1439 and below the section becomes a single
// centered column, the logo scales, and the signpost group moves below the
// copyright with its tilts intact. Desktop keeps the exact absolute geometry.
//
// Motion (MOTION_SPEC 11, DOM/SVG version), layered so each effect owns one
// property:
//   footer-logo-wrap   entrance inflate (elastic.out(1, .5)) + hover squash/sparkles
//   footer-socials     pop-in with stagger; hover jump/rotate; click spins 360
//   signpost           pole scaleY from the top, ball squash on land
//   .footer-sign       drop with gravity, damped swing to the Figma rotation,
//                      idle wind sway, hover swing, flap on click, then scroll
//   signpost-wrap      ScrollFeel depth y (uniform for pole + signs)
//   copyright lines    mask-rise via the page-wide TextSystem (data-split)
//   "No pixels were harmed" spawns a 6-square pixel burst on hover
//   Back to Top        signs sway during the 1.6s glide; the nav logo squashes on arrival
// The drawer-free GL fabric is skipped (DP: GL optional in spec); static and
// reduced motion render the exact DESIGN_SPEC frame (signs keep their Figma
// rotations inline, nothing animates).

import { useLayoutEffect, useRef } from 'react';
import { EASE } from '../motion/ease';
import { gsap, ScrollTrigger } from '../motion/gsap';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';
import { Logo } from './svg/Logo';
import { Signpost } from './svg/Signpost';
import { LinkedIn } from './svg/LinkedIn';
import { Mail } from './svg/Mail';
import { Behance } from './svg/Behance';
import { Instagram } from './svg/Instagram';
import { SectionEdge } from './SectionEdge';

const COPYRIGHT = ' © 2026 Lois Amadi. All rights reserved, all wrongs forgiven... eventually. No pixels were harmed in the making of this site.';
const BUILDER_HREF = 'https://amadi-jason.vercel.app';

// Social row (11.1). LinkedIn and Mail are the Figma icons; Behance and
// Instagram are the approved placeholders for the two unknown slots
// (OPEN_QUESTIONS 6) and will be swapped when Lois supplies the real list.
const SOCIALS = [
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/loisamadi3', bg: '#dbbcff', glyph: <LinkedIn /> },
  { id: 'mail', label: 'Email', href: 'mailto:loisjasmine03@gmail.com', bg: '#fbd4e6', glyph: <Mail /> },
  { id: 'behance', label: 'Behance', href: 'https://www.behance.net/loisamadi3', bg: '#fef5b6', glyph: <Behance /> },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/loisamadi3', bg: '#bed35a', glyph: <Instagram /> },
] as const;

const SIGNS = [
  { label: 'Back to Top', fill: '#ff8c42', rot: 0, y: '160.8px', font: 'var(--ff-ink)', kind: 'top' },
  { label: 'About', fill: '#dbbcff', rot: -5.17, y: '237.8px', font: 'var(--ff-outfit)', kind: 'hash', href: '#about' },
  { label: 'Work', fill: '#cff5ff', rot: 5.15, y: '335.7px', font: 'var(--ff-outfit)', kind: 'hash', href: '#work' },
  { label: 'Services', fill: '#fbd4e6', rot: -3.15, y: '433.6px', font: 'var(--ff-ink)', kind: 'hash', href: '#services' },
  { label: 'Get in Touch', fill: '#fef5b6', rot: 2.05, y: '522.8px', font: 'var(--ff-ink)', kind: 'hash', href: '#contact' },
] as const;

const REST_ROTATIONS = SIGNS.map((sign) => sign.rot);

/* MOTION_SPEC 11 values. */
const MOTION = {
  pop: { fromScale: 0, stagger: 0.09, duration: 0.6 },
  drop: { y: -170, duration: 0.62, start: 0.65, step: 0.12, wind: 26 },
  swing: { duration: 1.15, delay: 0.08 },
  sway: { amplitude: 0.6, duration: 2.6 },
  hover: { swing: 8 },
  flap: { up: 90, down: 0.35 },
  backToTop: { duration: 1.6 },
} as const;

const SPARKLE_SVG =
  '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 0l2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4z"/></svg>';

const PIXEL_COLORS = ['var(--yellow)', 'var(--lime)', 'var(--pink)', 'var(--blue)', 'var(--orange-cta)', 'var(--footer-text)'] as const;

export function Footer() {
  const { reducedMotion, lenisRef, scrollTo } = useMotion();
  const finePointer = useMediaQuery('(pointer: fine)');

  const sectionRef = useRef<HTMLElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const sparkleHostRef = useRef<HTMLDivElement>(null);
  const signpostWrapRef = useRef<HTMLDivElement>(null);
  const socialRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const signRefs = useRef<Array<HTMLElement | null>>([]);

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    const logoWrap = logoWrapRef.current;
    const signpostWrap = signpostWrapRef.current;
    if (!section || !signpostWrap) return;

    const logoSvg = logoWrap?.querySelector('svg') ?? null;
    const pole = section.querySelector<SVGPathElement>('.signpost-pole');
    const ball = section.querySelector<SVGGElement>('.signpost-ball');
    const base = section.querySelector<SVGEllipseElement>('.signpost-base');
    const socials = socialRefs.current.filter((el): el is HTMLAnchorElement => el !== null);
    const signs = signRefs.current.filter((el): el is HTMLElement => el !== null);

    const tweens: gsap.core.Animation[] = [];
    const timelines: gsap.core.Timeline[] = [];
    const triggers: ScrollTrigger[] = [];
    const listeners: Array<() => void> = [];

    // The swing pivots at the pole-side edge (DESIGN_SPEC 11.2), not the Figma
    // center origin used by the static render. GSAP recomputes the position, so
    // this compensates without moving a pixel at rest.
    for (const sign of signs) gsap.set(sign, { transformOrigin: '0% 50%' });

    // 11 entrance: logo inflates, socials pop, pole draws, ball squashes, the
    // five signs drop with gravity and land with a damped swing. One timeline,
    // so the whole sequence plays as one gesture.
    const enter = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });
    if (logoWrap) {
      enter.fromTo(
        logoWrap,
        { scale: 0.6, transformOrigin: '50% 60%' },
        { scale: 1, duration: 1.4, ease: 'elastic.out(1, 0.5)' },
        0,
      );
    }
    if (socials.length) {
      enter.fromTo(
        socials,
        { scale: MOTION.pop.fromScale, transformOrigin: '50% 50%' },
        { scale: 1, duration: MOTION.pop.duration, ease: 'back.out(1.7)', stagger: MOTION.pop.stagger },
        0.3,
      );
    }
    if (base) enter.fromTo(base, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.15);
    if (pole) {
      enter.fromTo(
        pole,
        { scaleY: 0, transformOrigin: '50% 0%' },
        { scaleY: 1, duration: 0.55, ease: 'power2.out' },
        0.2,
      );
    }
    if (ball) {
      enter.fromTo(
        ball,
        { scale: 0, transformOrigin: '50% 50%' },
        {
          keyframes: [
            { scaleX: 1.4, scaleY: 0.78, duration: 0.18, ease: 'power2.out' },
            { scaleX: 0.82, scaleY: 1.16, duration: 0.16, ease: 'power2.inOut' },
            { scaleX: 1, scaleY: 1, duration: 0.3, ease: EASE.squash },
          ],
        },
        0.45,
      );
    }
    signs.forEach((sign, index) => {
      const rest = REST_ROTATIONS[index];
      const at = MOTION.drop.start + index * MOTION.drop.step;
      enter.fromTo(
        sign,
        { y: MOTION.drop.y, opacity: 0 },
        { y: 0, opacity: 1, duration: MOTION.drop.duration, ease: 'power2.in' },
        at,
      );
      enter.fromTo(
        sign,
        { rotation: rest + (index % 2 === 0 ? -MOTION.drop.wind : MOTION.drop.wind) },
        { rotation: rest, duration: MOTION.swing.duration, ease: EASE.swing },
        at + MOTION.swing.delay,
      );
    });
    timelines.push(enter);

    // 11 idle wind sway: starts after the entrance, ±0.6deg, offsets. Pauses
    // when the section is off-screen; scroll velocity speeds up the sway.
    const sways: gsap.core.Tween[] = [];
    enter.eventCallback('onComplete', () => {
      signs.forEach((sign, index) => {
        const rest = REST_ROTATIONS[index];
        sways.push(
          gsap.fromTo(
            sign,
            { rotation: rest - MOTION.sway.amplitude },
            {
              rotation: rest + MOTION.sway.amplitude,
              duration: MOTION.sway.duration + index * 0.35,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
              delay: index * 0.25,
            },
          ),
        );
        tweens.push(...sways);
      });
    });
    const swayGate = ScrollTrigger.create({
      trigger: signpostWrap,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        for (const sway of sways) {
          if (self.isActive && !document.hidden) sway.play();
          else sway.pause();
        }
      },
    });
    triggers.push(swayGate);
    const swayVelocity = (_time: number, deltaTime: number) => {
      void deltaTime;
      const velocity = lenisRef.current ? Math.abs(lenisRef.current.velocity) : 0;
      const scale = 1 + Math.min(velocity / 28, 1.6);
      for (const sway of sways) sway.timeScale(scale);
    };
    gsap.ticker.add(swayVelocity);
    listeners.push(() => gsap.ticker.remove(swayVelocity));

    // 11 logo hover: squash and three sparkles float up and fade.
    if (finePointer && logoWrap && logoSvg) {
      const onEnter = () => {
        gsap.killTweensOf(logoSvg);
        gsap
          .timeline({ defaults: { transformOrigin: '50% 50%' } })
          .to(logoSvg, { scaleX: 1.08, scaleY: 0.92, duration: 0.16, ease: EASE.squash })
          .to(logoSvg, { scaleX: 0.96, scaleY: 1.06, duration: 0.14, ease: EASE.squash })
          .to(logoSvg, { scaleX: 1, scaleY: 1, duration: 0.22, ease: EASE.squash });

        const host = sparkleHostRef.current;
        if (!host || host.childElementCount > 0) return;
        const sparkles: HTMLSpanElement[] = [];
        for (let index = 0; index < 3; index += 1) {
          const sparkle = document.createElement('span');
          sparkle.className = 'footer-sparkle';
          sparkle.innerHTML = SPARKLE_SVG;
          host.appendChild(sparkle);
          sparkles.push(sparkle);
        }
        gsap
          .timeline({ onComplete: () => sparkles.forEach((sparkle) => sparkle.remove()) })
          .fromTo(
            sparkles,
            { x: 0, y: 0, scale: 0, rotation: 0, opacity: 0 },
            {
              x: (index) => (index - 1) * 34,
              y: -46,
              scale: 1,
              rotation: (index) => (index % 2 === 0 ? -40 : 40),
              opacity: 1,
              duration: 0.55,
              ease: EASE.pop,
              stagger: 0.09,
            },
          )
          .to(sparkles, { y: 16, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.06 }, 0.6);
      };
      logoWrap.addEventListener('pointerenter', onEnter);
      listeners.push(() => logoWrap.removeEventListener('pointerenter', onEnter));
    }

    // 11 socials hover: jump and alternate tilt; click spins the glyph 360.
    socials.forEach((social, index) => {
      const glyph = social.querySelector('svg') ?? social;
      const rest = index % 2 === 0 ? -6 : 6;
      const onEnter = () => {
        gsap.to(social, { y: -8, rotation: rest, duration: 0.4, ease: EASE.pop, overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(social, { y: 0, rotation: 0, duration: 0.5, ease: EASE.glide, overwrite: 'auto' });
      };
      const onClick = () => {
        // A full turn, then drop the transform entirely so the glyph rests
        // clean (and the next click starts from zero).
        gsap.fromTo(
          glyph,
          { rotation: 0 },
          {
            rotation: 360,
            duration: 0.7,
            ease: EASE.glide,
            overwrite: 'auto',
            onComplete: () => gsap.set(glyph, { clearProps: 'transform' }),
          },
        );
      };
      social.addEventListener('pointerenter', onEnter);
      social.addEventListener('pointerleave', onLeave);
      social.addEventListener('click', onClick);
      listeners.push(() => {
        social.removeEventListener('pointerenter', onEnter);
        social.removeEventListener('pointerleave', onLeave);
        social.removeEventListener('click', onClick);
      });
    });

    // 11 sign hover: swing, brighten and lift; keyboard focus gets the same.
    signs.forEach((sign, index) => {
      const rest = REST_ROTATIONS[index];
      const direction = index % 2 === 0 ? MOTION.hover.swing : -MOTION.hover.swing;
      const onEnter = () => {
        sign.classList.add('footer-sign--hover');
        gsap.to(sign, { rotation: rest + direction, duration: 0.9, ease: EASE.swing, overwrite: 'auto' });
      };
      const onLeave = () => {
        sign.classList.remove('footer-sign--hover');
        gsap.to(sign, { rotation: rest, duration: 0.6, ease: EASE.glide, overwrite: 'auto' });
      };
      const onFocus = () => sign.classList.add('footer-sign--hover');
      const onBlur = () => sign.classList.remove('footer-sign--hover');
      sign.addEventListener('pointerenter', onEnter);
      sign.addEventListener('pointerleave', onLeave);
      sign.addEventListener('focus', onFocus);
      sign.addEventListener('blur', onBlur);
      listeners.push(() => {
        sign.removeEventListener('pointerenter', onEnter);
        sign.removeEventListener('pointerleave', onLeave);
        sign.removeEventListener('focus', onFocus);
        sign.removeEventListener('blur', onBlur);
      });
    });

    // 11 back to top: signs sway, the page glides up, the nav logo squashes.
    // Hash signs use the shared lenis scroll with the spec's 1.4 glide.
    const onSignActivate = (index: number, event: MouseEvent | KeyboardEvent) => {
      const sign = SIGNS[index];
      const element = signs[index];
      if (!element) return;

      // Flap: rotateX to 90 and back, then navigate.
      gsap
        .timeline()
        .to(element, { rotationX: MOTION.flap.up, duration: MOTION.flap.down / 2, ease: 'power2.in', transformPerspective: 800 })
        .to(element, { rotationX: 0, duration: MOTION.flap.down / 2, ease: 'power2.out' });
      try {
        navigator.vibrate?.(8);
      } catch {
        // Haptics are best-effort.
      }

      if (sign.kind === 'top') {
        // Stronger sway on the signs while the page travels.
        signs.forEach((target, swayIndex) => {
          const rest = REST_ROTATIONS[swayIndex];
          gsap
            .timeline({ delay: swayIndex * 0.06 })
            .fromTo(target, { rotation: rest - 2.6 }, { rotation: rest + 2.6, duration: 0.55, ease: EASE.swing })
            .to(target, { rotation: rest, duration: 0.45, ease: EASE.glide });
        });
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, {
            duration: MOTION.backToTop.duration,
            onComplete: () => window.dispatchEvent(new CustomEvent('lois:back-to-top')),
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
        return;
      }

      const target = sign.href ? document.querySelector<HTMLElement>(sign.href) : null;
      if (target) {
        event.preventDefault();
        scrollTo(target);
      }
    };
    const signClicks = SIGNS.map((_, index) => index);
    for (const index of signClicks) {
      const element = signs[index];
      if (!element) continue;
      const handler = (event: MouseEvent) => onSignActivate(index, event);
      element.addEventListener('click', handler);
      listeners.push(() => element.removeEventListener('click', handler));
    }

    // 11 pixel burst on the "No pixels were harmed" phrase. TextSystem
    // rebuilds the split paragraph after mount, so delegation on the section
    // survives any node replacement.
    if (finePointer) {
      let active = false;
      const onPointerOver = (event: PointerEvent) => {
        const host = section.querySelector<HTMLSpanElement>('.footer-pixel-host');
        const target = event.target as HTMLElement | null;
        const trigger = target?.closest?.('.footer-pixel-trigger');
        if (!trigger || active || !host || host.childElementCount > 0) return;
        active = true;

        const squares: HTMLSpanElement[] = [];
        for (let index = 0; index < 6; index += 1) {
          const square = document.createElement('span');
          square.className = 'footer-pixel-square';
          square.style.background = PIXEL_COLORS[index % PIXEL_COLORS.length];
          host.appendChild(square);
          squares.push(square);
        }
        gsap
          .timeline({ onComplete: () => squares.forEach((square) => square.remove()) })
          .fromTo(
            squares,
            { x: 0, y: 0, scale: 0, opacity: 0 },
            {
              x: (index) => (index - 2.5) * 16 + (Math.random() - 0.5) * 10,
              y: () => -28 - Math.random() * 26,
              scale: 1,
              rotation: (index) => (index % 2 === 0 ? 45 : -45),
              opacity: 1,
              duration: 0.42,
              ease: EASE.pop,
              stagger: 0.04,
            },
          )
          .to(squares, { y: 56, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.03 }, 0.5);
      };
      const onPointerOut = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        const trigger = target?.closest?.('.footer-pixel-trigger');
        if (!trigger) return;
        const related = event.relatedTarget as Node | null;
        if (related && trigger.contains(related)) return;
        active = false;
      };
      section.addEventListener('pointerover', onPointerOver);
      section.addEventListener('pointerout', onPointerOut);
      listeners.push(() => {
        section.removeEventListener('pointerover', onPointerOver);
        section.removeEventListener('pointerout', onPointerOut);
      });
    }

    return () => {
      for (const listener of listeners) listener();
      for (const trigger of triggers) trigger.kill();
      for (const timeline of timelines) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      }
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      if (pole) gsap.set(pole, { clearProps: 'transform' });
      if (ball) gsap.set(ball, { clearProps: 'transform' });
      if (base) gsap.set(base, { clearProps: 'opacity' });
      for (const sign of signs) gsap.set(sign, { clearProps: 'transform,opacity' });
      for (const social of socials) gsap.set(social, { clearProps: 'transform' });
      if (logoWrap) gsap.set(logoWrap, { clearProps: 'transform' });
      for (const sign of signs) sign.classList.remove('footer-sign--hover');
    };
  }, [reducedMotion, finePointer, lenisRef, scrollTo]);

  return (
    <section
      ref={sectionRef}
      data-section="footer"
      id="footer"
      aria-label="Footer"
      className={`footer-section relative w-full section-bg-footer${reducedMotion ? '' : ' footer-stripes--drift'}`}
      style={{ height: '716px' }}
    >
      <SectionEdge variant="tear" from="var(--cta-bg)" />
      {/* Left column: logo, socials, copyright, credit. Content context inset
          to the section frame; children use section-absolute coords. The
          signpost group is one parallax unit so pole and signs move together. */}
      <div className="footer-left" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div
          ref={logoWrapRef}
          className="footer-logo-wrap"
          style={{ position: 'absolute', top: '76px', left: '72px', width: '506.9px', height: '271.2px' }}
        >
          <Logo
            className="footer-logo"
            variant="footer"
            width={506.9}
            height={271.2}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div ref={sparkleHostRef} className="footer-logo-sparkles" aria-hidden="true" />
        </div>

        {/* Social row at y=412.4. display:contents on desktop keeps each tile
            on its exact absolute x; the responsive column turns this into a
            flex row. */}
        <div className="footer-socials" style={{ display: 'contents' }}>
          {SOCIALS.map((social, index) => (
            <a
              key={social.id}
              ref={(element) => {
                socialRefs.current[index] = element;
              }}
              className="footer-social"
              href={social.href}
              target={social.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={social.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
              aria-label={social.label}
              style={{
                position: 'absolute',
                top: '412.4px',
                left: ['72px', '146px', '220.1px', '294.1px'][index],
                width: '59.8px',
                height: '52.4px',
                background: social.bg,
                borderRadius: '5.69px',
              }}
            >
              <div style={{ position: 'absolute', inset: '11.4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--ink)', display: 'inline-flex' }}>{social.glyph}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Copyright at y=530, two lines, Outfit 400 28/35.3, ls -0.56, #fffef3. */}
        <p
          data-split="lines"
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
          {COPYRIGHT.slice(0, COPYRIGHT.indexOf('No pixels were harmed'))}
          <span className="footer-pixel-trigger">
            No pixels were harmed<span className="footer-pixel-host" aria-hidden="true" />
          </span>
          {COPYRIGHT.slice(COPYRIGHT.indexOf('No pixels were harmed') + 'No pixels were harmed'.length)}
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
          Designed by Lois, Build by{' '}
          <a
            href={BUILDER_HREF}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Jason
          </a>
          . Tweaked approximately a thousand times.
        </p>

        {/* Signpost at x=1132, y=76, with five HTML signs. One parallax unit. */}
        <div
          ref={signpostWrapRef}
          className="footer-signpost-wrap"
          data-depth="0.3"
          style={{ position: 'absolute', top: '76px', left: '1132px', width: '236px', height: '576px' }}
        >
          <div className="footer-signpost" style={{ position: 'absolute', top: 0, left: 0, width: '236px' }}>
            <Signpost />
          </div>
          {SIGNS.map((sign, index) => {
            const style = {
              ['--sign-y' as string]: sign.y,
              position: 'absolute' as const,
              top: `calc(${sign.y} - 76px)`,
              left: '6px',
              width: '224px',
              height: '61px',
              border: '1px solid var(--ink)',
              borderRadius: '8px',
              background: sign.fill,
              transform: `rotate(${sign.rot}deg)`,
            };
            const content = (
              <div style={{ position: 'absolute', inset: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span
                  className="footer-sign-label"
                  style={{
                    fontFamily: sign.font,
                    fontWeight: sign.font === 'var(--ff-ink)' ? 500 : 400,
                    fontSize: '24px',
                    lineHeight: '28.8px',
                    color: 'var(--ink)',
                    textAlign: 'center',
                  }}
                >
                  {sign.label}
                </span>
              </div>
            );
            const signClass = 'footer-sign';
            if (sign.kind === 'top') {
              return (
                <button
                  key={sign.label}
                  ref={(element) => {
                    signRefs.current[index] = element;
                  }}
                  type="button"
                  className={`${signClass} footer-sign--button`}
                  style={style}
                  aria-label="Back to top"
                >
                  {content}
                </button>
              );
            }
            return (
              <a
                key={sign.label}
                ref={(element) => {
                  signRefs.current[index] = element;
                }}
                className={signClass}
                style={style}
                href={sign.href}
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
