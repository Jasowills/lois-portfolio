// Custom cursor, MOTION_SPEC 2.2. Desktop pointer:fine only and never in
// static or reduced-motion mode. A 14px ink dot tracks the pointer quickly; a
// 44px outlined blob trails it with a 0.12s spring and wobbles with velocity.
// Context morphs the blob into the link, view and drag states, and the whole
// overlay hides over form fields so the system caret returns.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight } from './svg/ArrowUpRight';
import { blobPath } from '../motion/blob';
import { EASE } from '../motion/ease';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';

type CursorState = 'default' | 'link' | 'view' | 'drag' | 'native';
type CursorVisual = Exclude<CursorState, 'native'>;

// Exact motion values from MOTION_SPEC 2.2 (blob 44px, link 64px, view 96px).
// The drag pill and the label sizes are not specified; they are sized to fit
// the copy and logged in OPEN_QUESTIONS 41.
const SPEC = {
  dot: 14,
  box: { width: 160, height: 96, cx: 80, cy: 48 },
  spring: { stiffness: 280, damping: 32, dotStiffness: 900, dotDamping: 55 },
  wobble: { max: 0.16, perPixel: 0.004, decay: 0.18, speed: 20 },
  morph: 0.38,
  fade: '160ms',
  easeCss: 'cubic-bezier(0.16, 1, 0.3, 1)',
  label: { view: '15px', drag: '14px', gap: '6px', chevron: 12 },
} as const;

const SHAPE: Record<CursorVisual, { rx: number; ry: number }> = {
  default: { rx: 22, ry: 22 },
  link: { rx: 32, ry: 32 },
  view: { rx: 48, ry: 48 },
  drag: { rx: 60, ry: 38 },
};

const FILL: Record<CursorVisual, string> = {
  default: 'none',
  link: 'var(--yellow)',
  view: 'var(--orange-cta)',
  drag: 'var(--ink-warm)',
};

const INITIAL_PATH = blobPath({
  cx: SPEC.box.cx,
  cy: SPEC.box.cy,
  rx: SHAPE.default.rx,
  ry: SHAPE.default.ry,
});

function resolveState(target: Element | null): CursorState {
  if (!target) return 'default';
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return 'native';
  }
  const tagged = target.closest<HTMLElement>('[data-cursor]');
  const value = tagged?.dataset.cursor;
  if (value === 'view' || value === 'drag' || value === 'link') return value;
  if (target.closest('a, button, [role="button"], summary')) return 'link';
  return 'default';
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width={SPEC.label.chevron}
      height={SPEC.label.chevron}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function labelStyle(active: boolean, color: string, extra?: CSSProperties): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color,
    opacity: active ? 1 : 0,
    transform: `scale(${active ? 1 : 0.72})`,
    transition: `opacity ${SPEC.fade} ${SPEC.easeCss}, transform ${SPEC.fade} ${SPEC.easeCss}`,
    ...extra,
  };
}

export function Cursor() {
  const { quality, reducedMotion } = useMotion();
  const [finePointer, setFinePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  );
  const [state, setState] = useState<CursorState>('default');
  const enabled = !reducedMotion && quality !== 'low' && finePointer;

  const stateRef = useRef<CursorState>('default');
  const dotRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const morph = useRef({ rx: SHAPE.default.rx, ry: SHAPE.default.ry });

  // Track pointer capability: a hybrid device can report fine then coarse.
  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)');
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Animate the blob radii between states; the ticker rebuilds the path from
  // these numbers every frame.
  useEffect(() => {
    if (!enabled) return;
    const target = SHAPE[state === 'native' ? 'default' : state];
    const tween = gsap.to(morph.current, {
      rx: target.rx,
      ry: target.ry,
      duration: SPEC.morph,
      ease: EASE.pop,
      overwrite: true,
    });
    return () => {
      tween.kill();
    };
  }, [enabled, state]);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add('cursor-custom');

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dot = { x: pointer.x, y: pointer.y, vx: 0, vy: 0 };
    const blob = { x: pointer.x, y: pointer.y, vx: 0, vy: 0 };
    const previous = { x: pointer.x, y: pointer.y };
    const wobble = { energy: 0, phase: 0 };
    let moved = false;
    let visible = false;
    let shown = false;

    const place = (element: HTMLDivElement | null, x: number, y: number) => {
      if (element) {
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const paintVisibility = () => {
      const next = visible && stateRef.current !== 'native';
      if (next === shown) return;
      shown = next;
      if (dotRef.current) dotRef.current.style.opacity = next ? '1' : '0';
      if (blobRef.current) blobRef.current.style.opacity = next ? '1' : '0';
    };

    const tick = (_time: number, deltaTime: number) => {
      if (!moved) return;
      const dt = Math.min(deltaTime, 33) / 1000;
      if (dt <= 0) return;

      // Semi-implicit Euler springs. The dot settles almost instantly, the
      // blob keeps the 0.12s trailing feel from the spec.
      const dotAccelX =
        (pointer.x - dot.x) * SPEC.spring.dotStiffness - dot.vx * SPEC.spring.dotDamping;
      const dotAccelY =
        (pointer.y - dot.y) * SPEC.spring.dotStiffness - dot.vy * SPEC.spring.dotDamping;
      dot.vx += dotAccelX * dt;
      dot.vy += dotAccelY * dt;
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;

      const blobAccelX =
        (pointer.x - blob.x) * SPEC.spring.stiffness - blob.vx * SPEC.spring.damping;
      const blobAccelY =
        (pointer.y - blob.y) * SPEC.spring.stiffness - blob.vy * SPEC.spring.damping;
      blob.vx += blobAccelX * dt;
      blob.vy += blobAccelY * dt;
      blob.x += blob.vx * dt;
      blob.y += blob.vy * dt;

      wobble.energy *= Math.exp(-dt / SPEC.wobble.decay);
      wobble.phase += dt * (1.4 + wobble.energy * SPEC.wobble.speed);

      place(dotRef.current, dot.x, dot.y);
      place(blobRef.current, blob.x, blob.y);

      if (pathRef.current) {
        pathRef.current.setAttribute(
          'd',
          blobPath({
            cx: SPEC.box.cx,
            cy: SPEC.box.cy,
            rx: morph.current.rx,
            ry: morph.current.ry,
            wobble: Math.min(SPEC.wobble.max, wobble.energy),
            phase: wobble.phase,
          }),
        );
      }
      paintVisibility();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!moved) {
        dot.x = pointer.x;
        dot.y = pointer.y;
        blob.x = pointer.x;
        blob.y = pointer.y;
        previous.x = pointer.x;
        previous.y = pointer.y;
        moved = true;
      } else {
        const speed = Math.hypot(pointer.x - previous.x, pointer.y - previous.y);
        wobble.energy = Math.max(
          wobble.energy,
          Math.min(SPEC.wobble.max, speed * SPEC.wobble.perPixel),
        );
        previous.x = pointer.x;
        previous.y = pointer.y;
      }

      visible = true;
      const next = resolveState(event.target as Element | null);
      if (next !== stateRef.current) {
        stateRef.current = next;
        setState(next);
      }
      paintVisibility();
    };

    const hide = () => {
      visible = false;
      paintVisibility();
    };

    const onVisibility = () => {
      if (document.hidden) hide();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('pointerleave', hide);
    document.addEventListener('visibilitychange', onVisibility);
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('pointerleave', hide);
      document.removeEventListener('visibilitychange', onVisibility);
      gsap.ticker.remove(tick);
      root.classList.remove('cursor-custom');
    };
  }, [enabled]);

  if (!enabled) return null;

  const visual: CursorVisual = state === 'native' ? 'default' : state;
  const isDefault = visual === 'default';

  return (
    <div
      aria-hidden="true"
      data-cursor-state={state}
      className="pointer-events-none fixed left-0 top-0 z-[200]"
    >
      {/* Trailing blob. The wrapper is centred on the pointer so every state
          morphed from the same origin. */}
      <div
        ref={blobRef}
        className="absolute left-0 top-0"
        style={{
          opacity: 0,
          transition: `opacity ${SPEC.fade} linear`,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -SPEC.box.width / 2,
            top: -SPEC.box.height / 2,
            width: SPEC.box.width,
            height: SPEC.box.height,
          }}
        >
          <svg
            width={SPEC.box.width}
            height={SPEC.box.height}
            viewBox={`0 0 ${SPEC.box.width} ${SPEC.box.height}`}
            fill="none"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              mixBlendMode: visual === 'link' ? 'multiply' : 'normal',
            }}
          >
            <path
              ref={pathRef}
              d={INITIAL_PATH}
              fill={FILL[visual]}
              stroke={visual === 'drag' ? 'var(--ink-warm)' : 'var(--ink)'}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              style={{
                transition: `fill ${SPEC.fade} linear, stroke ${SPEC.fade} linear`,
              }}
            />
          </svg>

          {/* Link / button: arrow appears inside the yellow circle. */}
          <div style={labelStyle(visual === 'link', 'var(--ink-warm)')}>
            <ArrowUpRight width={18} height={18} />
          </div>

          {/* Project card: 96px orange "View" pill. */}
          <div style={labelStyle(visual === 'view', 'var(--ink-warm)')}>
            <span
              style={{
                fontFamily: 'var(--ff-outfit)',
                fontSize: SPEC.label.view,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              View
            </span>
          </div>

          {/* Draggable rows: "Drag" between chevrons. */}
          <div style={labelStyle(visual === 'drag', 'var(--cream)')}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPEC.label.gap,
                fontFamily: 'var(--ff-outfit)',
                fontSize: SPEC.label.drag,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              <Chevron direction="left" />
              Drag
              <Chevron direction="right" />
            </span>
          </div>
        </div>
      </div>

      {/* Leading dot. It steps back whenever the blob carries a label. */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0"
        style={{
          opacity: 0,
          transition: `opacity ${SPEC.fade} linear`,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -SPEC.dot / 2,
            top: -SPEC.dot / 2,
            width: SPEC.dot,
            height: SPEC.dot,
            borderRadius: '9999px',
            background: 'var(--ink)',
            opacity: isDefault ? 1 : 0,
            transform: `scale(${isDefault ? 1 : 0.4})`,
            transition: `opacity ${SPEC.fade} ${SPEC.easeCss}, transform ${SPEC.fade} ${SPEC.easeCss}`,
          }}
        />
      </div>
    </div>
  );
}
