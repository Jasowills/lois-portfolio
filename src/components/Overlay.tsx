// Shared project overlay, MOTION_SPEC 4.4. Cards in Hero and Selected work
// expand into a full-viewport project sheet with a GSAP Flip from the card
// image, a blurred and dimmed page behind, a scrollable project summary,
// tags, gallery, close sticker, focus trap, Esc and swipe-down close.
//
// The overlay is a portal so section transforms can never become its
// containing block. Reduced motion and ?static=1 open the same content with
// no animation, so the interactive layer is never motion-only.

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import projectsJson from '../data/projects.json';
import { Verified } from './svg/Verified';
import { StickerLabel } from './ui/StickerLabel';
import { EASE } from '../motion/ease';
import { Flip, gsap, SplitText } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';

export type Project = (typeof projectsJson.projects)[number];
type ProjectImageData = Project['images'][number];

const SPEC = {
  overlayZ: 90,
  backdropZ: 89,
  closeZ: 95,
  radius: 36,
  heroHeight: 'min(62vh, 620px)',
  heroHeightMobile: '46vh',
  flip: 0.7,
  flipClose: 0.55,
  fade: 0.4,
  swipe: 110,
} as const;

const CHECKER_BG =
  'conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%, var(--card-check-b) 50% 75%, var(--card-check-a) 75%) 0.5px 0.5px / 48px 48px';

const CONTENT_PAD = '48px 72px 80px';

function isPlaceholder(image: ProjectImageData): boolean {
  return 'placeholder' in image && image.placeholder === true;
}

function imageSrc(image: ProjectImageData): string {
  return image.webp[image.webp.length - 1] ?? '';
}

function ProjectImage({
  image,
  sizes,
  eager = false,
  style,
}: {
  image: ProjectImageData;
  sizes: string;
  eager?: boolean;
  style?: CSSProperties;
}) {
  if (isPlaceholder(image)) {
    return (
      <div
        aria-label={image.alt}
        role="img"
        style={{ width: '100%', height: '100%', background: CHECKER_BG, ...style }}
      />
    );
  }
  return (
    <picture style={{ display: 'block', width: '100%', height: '100%', ...style }}>
      <source type="image/avif" srcSet={image.avif.join(', ')} sizes={sizes} />
      <source type="image/webp" srcSet={image.webp.join(', ')} sizes={sizes} />
      <img
        src={imageSrc(image)}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </picture>
  );
}

function Gallery({
  project,
  galleryRef,
}: {
  project: Project;
  galleryRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={galleryRef}
      data-overlay-interactive
      aria-label={`${project.title} gallery`}
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '12px',
        scrollSnapType: 'x mandatory',
        cursor: project.images.length > 1 ? 'grab' : 'default',
        overscrollBehaviorX: 'contain',
      }}
    >
      {project.images.map((image, index) => (
        <div
          key={`${image.role}-${index}`}
          style={{
            flex: 'none',
            width: 'min(72vw, 760px)',
            aspectRatio: '16 / 9',
            border: '1px solid var(--ink)',
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'var(--image-placeholder)',
            scrollSnapAlign: 'start',
          }}
        >
          <ProjectImage
            image={image}
            sizes="(max-width: 900px) 72vw, 760px"
            style={{ borderRadius: '24px' }}
          />
        </div>
      ))}
    </div>
  );
}

export function ProjectOverlay({
  project,
  source,
  returnFocus,
  onClose,
}: {
  project: Project | null;
  source: HTMLElement | null;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
}) {
  const { reducedMotion, lenisRef } = useMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const closeCallback = useRef(onClose);
  const sourceRef = useRef(source);
  const returnFocusRef = useRef(returnFocus ?? null);
  const drag = useRef({ down: false, x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    closeCallback.current = onClose;
  }, [onClose]);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    returnFocusRef.current = returnFocus ?? null;
  }, [returnFocus]);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    const hero = heroRef.current;
    const sourceEl = sourceRef.current;

    const done = () => closeCallback.current();
    if (reducedMotion) {
      done();
      return;
    }

    const timeline = gsap.timeline({ onComplete: done });
    if (hero && sourceEl) {
      const fit = Flip.fit(hero, sourceEl, {
        duration: SPEC.flipClose,
        ease: EASE.glide,
        scale: true,
      });
      if (fit) timeline.add(fit as gsap.core.Tween, 0);
    }
    if (backdrop) {
      timeline.to(backdrop, { opacity: 0, duration: 0.3, ease: 'none' }, 0.12);
    }
    if (panel) {
      timeline.to(
        panel,
        { opacity: 0, duration: 0.28, ease: 'none' },
        SPEC.flipClose - 0.15,
      );
    }
  };

  useLayoutEffect(() => {
    if (!project) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    const background = backgroundRef.current;
    const hero = heroRef.current;
    const content = contentRef.current;
    const close = closeRef.current;
    const title = titleRef.current;
    const sourceEl = sourceRef.current;
    const lenis = lenisRef.current;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    lenis?.stop();

    closingRef.current = false;
    close?.focus({ preventScroll: true });

    // The rest of the page is inert while the dialog is open, so Tab and
    // assistive tech cannot reach content behind the overlay.
    const appRoot = document.getElementById('root');
    const rootWasInert = appRoot?.hasAttribute('inert') ?? false;
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden') ?? null;
    appRoot?.setAttribute('inert', '');
    appRoot?.setAttribute('aria-hidden', 'true');

    const animations: gsap.core.Animation[] = [];
    let titleSplit: SplitText | null = null;

    if (reducedMotion) {
      if (panel) gsap.set(panel, { opacity: 1 });
      if (backdrop) gsap.set(backdrop, { opacity: 1 });
      if (background) gsap.set(background, { opacity: 1 });
      if (content) gsap.set(content, { opacity: 1 });
    } else {
      if (backdrop) {
        animations.push(
          gsap.fromTo(
            backdrop,
            { opacity: 0 },
            { opacity: 1, duration: SPEC.fade, ease: 'none' },
          ),
        );
      }
      if (background) {
        animations.push(
          gsap.fromTo(
            background,
            { opacity: 0 },
            { opacity: 1, duration: SPEC.fade, ease: 'none' },
          ),
        );
      }
      if (content) {
        animations.push(
          gsap.fromTo(
            content,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.28,
              ease: EASE.glide,
            },
          ),
        );
      }
      if (close) {
        animations.push(
          gsap.fromTo(
            close,
            { scale: 0, rotation: -20 },
            {
              scale: 1,
              rotation: -4,
              duration: 0.55,
              delay: 0.42,
              ease: EASE.pop,
            },
          ),
        );
      }

      // FLIP: place the hero at the card image, capture that state, restore
      // the full-viewport target and animate between them.
      if (hero && sourceEl) {
        const rect = sourceEl.getBoundingClientRect();
        const previousStyle = hero.getAttribute('style') ?? '';
        hero.style.position = 'fixed';
        hero.style.left = `${rect.left}px`;
        hero.style.top = `${rect.top}px`;
        hero.style.width = `${rect.width}px`;
        hero.style.height = `${rect.height}px`;
        hero.style.borderRadius = `${SPEC.radius}px`;
        hero.style.zIndex = '2';
        const state = Flip.getState(hero);
        hero.setAttribute('style', previousStyle);
        // Hold the card radius for the Flip, then round it off over 60% of the
        // open duration (MOTION_SPEC 4.4) on a separate tween.
        hero.style.borderRadius = `${SPEC.radius}px`;
        const flip = Flip.from(state, {
          duration: SPEC.flip,
          ease: EASE.glide,
          scale: true,
        });
        animations.push(flip);
        animations.push(
          gsap.to(hero, {
            borderRadius: 0,
            duration: SPEC.flip * 0.6,
            ease: EASE.glide,
          }),
        );
      }

      if (title) {
        titleSplit = SplitText.create(title, {
          type: 'lines',
          mask: 'lines',
          autoSplit: false,
          aria: 'auto',
        });
        if (titleSplit.lines.length) {
          animations.push(
            gsap.from(titleSplit.lines, {
              yPercent: 110,
              rotation: 3,
              duration: 0.8,
              stagger: 0.08,
              delay: 0.38,
              ease: EASE.glide,
            }),
          );
        }
      }
      const meta = panel
        ? Array.from(panel.querySelectorAll<HTMLElement>('[data-overlay-meta]'))
        : [];
      if (meta.length) {
        animations.push(
          gsap.from(meta, {
            opacity: 0,
            y: 18,
            duration: 0.55,
            stagger: 0.06,
            delay: 0.48,
            ease: EASE.glide,
          }),
        );
      }
    }

    const focusables = () => {
      if (!panel) return [] as HTMLElement[];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      for (const animation of animations) animation.kill();
      titleSplit?.revert();
      titleSplit?.kill();
      document.documentElement.style.overflow = previousOverflow;
      lenis?.start();
      if (appRoot && !rootWasInert) {
        appRoot.removeAttribute('inert');
        if (previousAriaHidden === null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previousAriaHidden);
      }
      const focusTarget = returnFocusRef.current ?? sourceRef.current;
      if (focusTarget && document.contains(focusTarget)) {
        focusTarget.focus({ preventScroll: true });
      }
    };
    // The overlay is mounted per project; source and motion mode are read at
    // open time so React re-renders cannot restart the Flip mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, reducedMotion]);

  // Gallery drag on fine pointers. Touch keeps native momentum and snapping.
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || reducedMotion) return;
    let active = false;
    let startX = 0;
    let startScroll = 0;

    const down = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      active = true;
      startX = event.clientX;
      startScroll = gallery.scrollLeft;
      gallery.setPointerCapture(event.pointerId);
      gallery.style.cursor = 'grabbing';
    };
    const move = (event: PointerEvent) => {
      if (!active) return;
      gallery.scrollLeft = startScroll - (event.clientX - startX);
    };
    const up = (event: PointerEvent) => {
      if (!active) return;
      active = false;
      gallery.releasePointerCapture(event.pointerId);
      gallery.style.cursor = 'grab';
    };

    gallery.addEventListener('pointerdown', down);
    gallery.addEventListener('pointermove', move);
    gallery.addEventListener('pointerup', up);
    gallery.addEventListener('pointercancel', up);
    return () => {
      gallery.removeEventListener('pointerdown', down);
      gallery.removeEventListener('pointermove', move);
      gallery.removeEventListener('pointerup', up);
      gallery.removeEventListener('pointercancel', up);
    };
  }, [reducedMotion]);

  if (!project) return null;

  const cover = project.images[0];
  const onHeroPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    drag.current = {
      down: true,
      x: event.clientX,
      y: event.clientY,
      scroll: panelRef.current?.scrollTop ?? 0,
    };
  };
  const onHeroPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    drag.current.down = false;
    const dy = event.clientY - drag.current.y;
    const dx = event.clientX - drag.current.x;
    const atTop = (panelRef.current?.scrollTop ?? 0) <= 0;
    if (atTop && dy > SPEC.swipe && Math.abs(dx) < 80) requestClose();
  };

  return createPortal(
    <>
      <div
        ref={backdropRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: SPEC.backdropZ,
          background: 'rgba(26, 22, 12, 0.32)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-lenis-prevent
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: SPEC.overlayZ,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: 'transparent',
          color: 'var(--ink)',
        }}
      >
        <div
          ref={backgroundRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cream)',
            zIndex: 0,
          }}
        />

        <div
          ref={heroRef}
          data-overlay-hero
          onPointerDown={onHeroPointerDown}
          onPointerUp={onHeroPointerUp}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: SPEC.heroHeight,
            borderRadius: 0,
            overflow: 'hidden',
            background: 'var(--image-placeholder)',
            touchAction: 'pan-y',
          }}
          className="max-[900px]:!h-[46vh]"
        >
          {cover ? (
            <ProjectImage image={cover} sizes="100vw" eager />
          ) : null}
        </div>

        <div
          ref={contentRef}
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1200px',
            margin: '0 auto',
            padding: CONTENT_PAD,
          }}
          className="max-[900px]:!px-5 max-[900px]:!pb-16 max-[900px]:!pt-9"
        >
          <div
            data-overlay-meta
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <StickerLabel
              label="Case study coming soon"
              fill="var(--yellow)"
              rotate={-2}
            />
            <span
              style={{
                fontFamily: 'var(--ff-outfit)',
                fontSize: '18px',
                lineHeight: '24px',
                color: 'var(--ink-soft)',
              }}
            >
              {project.year}
            </span>
          </div>

          <h2
            ref={titleRef}
            id={titleId}
            data-overlay-meta
            style={{
              margin: '28px 0 0',
              fontFamily: 'var(--ff-ink)',
              fontWeight: 700,
              fontSize: 'clamp(36px, 6vw, 64px)',
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: 'var(--heading)',
            }}
          >
            {project.title}
          </h2>

          <p
            id={descriptionId}
            data-overlay-meta
            style={{
              margin: '24px 0 0',
              maxWidth: '760px',
              fontFamily: 'var(--ff-outfit)',
              fontSize: '24px',
              lineHeight: '34px',
              letterSpacing: '-0.02em',
              color: 'var(--body)',
            }}
          >
            {project.description}
          </p>

          <ul
            aria-label="Tags"
            data-overlay-meta
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              listStyle: 'none',
              padding: 0,
              margin: '28px 0 0',
            }}
          >
            {project.tags.map((tag) => (
              <li
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '32px',
                  background: 'var(--tag-pink)',
                  fontFamily: 'var(--ff-outfit)',
                  fontSize: '16px',
                  color: 'var(--sub)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Verified />
                {tag}
              </li>
            ))}
          </ul>

          <div
            data-overlay-meta
            style={{
              marginTop: '48px',
              paddingTop: '28px',
              borderTop: '1px solid var(--ink)',
            }}
          >
            <h3
              style={{
                margin: '0 0 20px',
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 500,
                fontSize: '18px',
                lineHeight: '24px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
              }}
            >
              Project views
            </h3>
            <Gallery project={project} galleryRef={galleryRef} />
          </div>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          aria-label="Close project overlay"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: SPEC.closeZ,
            height: '52px',
            padding: '0 22px',
            borderRadius: '999px',
            border: '1px solid var(--ink)',
            background: 'var(--yellow)',
            color: 'var(--ink)',
            fontFamily: 'var(--ff-outfit)',
            fontWeight: 500,
            fontSize: '18px',
            lineHeight: '26px',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 var(--ink)',
            transform: 'rotate(-4deg)',
          }}
        >
          Close ×
        </button>
      </div>
    </>,
    document.body,
  );
}
