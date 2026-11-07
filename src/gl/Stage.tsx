// Shared WebGL stage (MOTION_SPEC 4.3b, 8, 11, 13, 14): one fixed OGL canvas
// for progressive enhancement. Static and reduced-motion users never mount it,
// and the DOM keeps the exact DESIGN_SPEC artwork: Hero planes sit behind the
// DOM card frame and its 1px outline, the stripe planes sit behind About and
// Footer content. No path is exposed to the static render.

import { useEffect, useRef } from 'react';
import projectsJson from '../data/projects.json';
import { useMotion } from '../motion/useMotion';
import { useStaticMode } from '../motion/useStaticMode';
import { useMediaQuery } from '../motion/useMediaQuery';
import sharedVertex from './shaders/shared-vertex.glsl?raw';
import heroFragment from './shaders/hero-card-fragment.glsl?raw';
import fabricFragment from './shaders/fabric-fragment.glsl?raw';

type AnyMesh = {
  scale: { set: (x: number, y: number, z?: number) => void };
  position: { set: (x: number, y: number, z?: number) => void };
  rotation: { set: (x: number, y: number, z: number) => void };
  program: { uniforms: Record<string, { value: unknown }>; remove?: () => void };
  geometry: { remove?: () => void };
  visible: boolean;
  renderOrder: number;
  addChild?: (child: unknown) => void;
};

type MeshEntry = {
  element: HTMLElement;
  mesh: AnyMesh;
  uniforms: Record<string, { value: unknown }>;
  isFabric: boolean;
  period: number;
  kind: 'hero' | 'fabric';
  visibleSince: number | null;
};

const RGB = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pickCoverUrl = (projectId: string): string | undefined => {
  const project = projectsJson.projects.find((entry) => entry.id === projectId);
  const image = project?.images[0];
  return image?.webp?.[1] ?? image?.webp?.[0] ?? image?.avif?.[1] ?? image?.avif?.[0];
};

const loadCoverCanvas = async (url: string): Promise<HTMLCanvasElement> => {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  const scale = Math.min(
    1,
    1024 / Math.max(image.naturalWidth || 1, image.naturalHeight || 1),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Missing canvas 2d context');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
};

const matrixAngle = (matrix: string): number => {
  if (!matrix || matrix === 'none') return 0;
  const match = /matrix\(([^)]+)\)/.exec(matrix);
  if (!match) return 0;
  const values = match[1].split(',').map(Number);
  return Math.atan2(values[1] || 0, values[0] || 0);
};

export function Stage() {
  const { quality, reducedMotion } = useMotion();
  const staticMode = useStaticMode();
  const finePointer = useMediaQuery('(pointer: fine)');
  const enabled =
    !staticMode &&
    !reducedMotion &&
    quality !== 'low' &&
    (finePointer || quality === 'high');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let raf = 0;
    let cancelIdle: () => void = () => undefined;
    let contextLossHandler: (() => void) | null = null;
    let contextRestoreHandler: (() => void) | null = null;
    let renderer: {
      gl: WebGLRenderingContext;
      setSize: (width: number, height: number) => void;
      render: (options: Record<string, unknown>) => void;
      state?: unknown;
    } | null = null;
    let scene: { addChild?: (child: unknown) => void } | null = null;
    let camera: {
      position: { set: (x: number, y: number, z: number) => void };
      aspect: number;
      updateMatrixWorld?: () => void;
    } | null = null;
    const meshes: MeshEntry[] = [];
    const resources: Array<{ remove?: () => void }> = [];
    let gl: WebGLRenderingContext | null = null;
    let lastFrame = performance.now();
    let lastPointer = { x: 0, y: 0, time: 0 };
    let lastScrollY = window.scrollY;

    const markReady = () => {
      if (!document.body.contains(canvas)) return;
      document.documentElement.dataset.glReady = 'true';
    };

    let cleanup = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelIdle();
      if (contextLossHandler) canvas.removeEventListener('webglcontextlost', contextLossHandler);
      if (contextRestoreHandler) canvas.removeEventListener('webglcontextrestored', contextRestoreHandler);
      for (const resource of resources) resource.remove?.();
      for (const entry of meshes) {
        entry.mesh.geometry.remove?.();
        entry.mesh.program.remove?.();
      }
      resources.length = 0;
      meshes.length = 0;
      renderer = null;
      scene = null;
      camera = null;
      gl = null;
      delete document.documentElement.dataset.glReady;
    };

    const resize = () => {
      if (!renderer) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      if (camera) camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    };

    const place = (mesh: AnyMesh, element: HTMLElement, isCard: boolean) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        mesh.visible = false;
        return false;
      }
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        mesh.visible = false;
        return false;
      }

      const width = isCard
        ? element.offsetWidth || rect.width
        : rect.width;
      const height = isCard
        ? element.offsetHeight || rect.height
        : rect.height;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const scaleX = (width / window.innerWidth) * 2;
      const scaleY = (height / window.innerHeight) * 2;
      const ndcX = (centerX / window.innerWidth) * 2 - 1;
      const ndcY = 1 - (centerY / window.innerHeight) * 2;
      const rotation = isCard
        ? matrixAngle(getComputedStyle(element).transform)
        : 0;

      mesh.visible = true;
      mesh.scale.set(scaleX, scaleY, 1);
      mesh.position.set(ndcX, ndcY, 0);
      mesh.rotation.set(0, 0, rotation);
      return true;
    };

    const init = async () => {
      if (cancelled) return;
      type OGLModules = {
        Renderer: new (options: Record<string, unknown>) => {
          gl: WebGLRenderingContext;
          setSize: (width: number, height: number) => void;
          render: (options: Record<string, unknown>) => void;
        };
        Camera: new (
          gl: WebGLRenderingContext,
          options?: Record<string, unknown>,
        ) => {
          position: { set: (x: number, y: number, z: number) => void };
          aspect: number;
          updateMatrixWorld?: () => void;
        };
        Program: new (
          gl: WebGLRenderingContext,
          options: Record<string, unknown>,
        ) => { uniforms: Record<string, { value: unknown }>; remove?: () => void };
        Mesh: new (
          gl: WebGLRenderingContext,
          options: Record<string, unknown>,
        ) => AnyMesh;
        Plane: new (gl: WebGLRenderingContext, options?: Record<string, unknown>) => { remove?: () => void };
        Texture: new (gl: WebGLRenderingContext, options?: Record<string, unknown>) => { remove?: () => void };
        Transform: new () => { addChild?: (child: unknown) => void };
      };
      let modules: OGLModules | undefined;
      try {
        modules = (await import('ogl')) as unknown as OGLModules;
      } catch {
        return;
      }
      if (cancelled || !modules) return;
      const { Renderer, Camera, Program, Mesh, Plane, Texture, Transform } = modules;

      try {
        renderer = new Renderer({
          canvas,
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
          alpha: true,
          depth: false,
          stencil: false,
          antialias: false,
          powerPreference: 'high-performance',
        });
        gl = renderer.gl;
        camera = new Camera(gl, {
          fov: 0,
          aspect: window.innerWidth / Math.max(1, window.innerHeight),
          near: 0.1,
          far: 10,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
        });
        camera.position.set(0, 0, 1);
        camera.updateMatrixWorld?.();
        scene = new Transform();
        resize();
      } catch {
        renderer = null;
        return;
      }

      const geometry = new Plane(gl, { width: 1, height: 1 });
      resources.push(geometry as unknown as { remove?: () => void });

      const heroElements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-hero-card]'),
      );
      const heroTargets = heroElements
        .map((element) => ({
          element,
          art: element.querySelector<HTMLElement>('[data-hero-art]'),
          id: element.dataset.heroCard || '',
        }))
        .filter((entry): entry is { element: HTMLElement; art: HTMLElement; id: string } => entry.art !== null);

      const loadedCovers = await Promise.all(
        heroTargets.map(async ({ id }) => {
          const url = pickCoverUrl(id);
          if (!url) return null;
          try {
            return await loadCoverCanvas(url);
          } catch {
            return null;
          }
        }),
      );
      if (cancelled || loadedCovers.some((cover) => cover === null)) {
        return;
      }
      const coverTextures = loadedCovers.map(
        (cover) =>
          new Texture(gl!, {
            image: cover!,
            generateMipmaps: true,
            minFilter: gl!.LINEAR_MIPMAP_LINEAR,
            magFilter: gl!.LINEAR,
            wrapS: gl!.CLAMP_TO_EDGE,
            wrapT: gl!.CLAMP_TO_EDGE,
          }) as unknown as { remove?: () => void },
      );
      resources.push(...coverTextures);

      heroTargets.forEach(({ art }, index) => {
        const cover = loadedCovers[index]!;
        const uniforms: Record<string, { value: unknown }> = {
          uMap: { value: coverTextures[index] },
          uSize: { value: [art.offsetWidth || 392, art.offsetHeight || 251] },
          uAspect: { value: cover.width / Math.max(1, cover.height) },
          uReveal: { value: 0 },
          uHover: { value: 0 },
          uPointer: { value: [0.5, 0.5] },
          uVelocity: { value: 0 },
          uTime: { value: 0 },
        };
        const program = new Program(gl!, {
          vertex: sharedVertex,
          fragment: heroFragment,
          uniforms,
          transparent: true,
          cullFace: null,
          depthTest: false,
          depthWrite: false,
        });
        const mesh = new Mesh(gl!, { geometry, program });
        mesh.renderOrder = 20 + index;
        meshes.push({
          element: art,
          mesh,
          uniforms,
          isFabric: false,
          period: 0,
          kind: 'hero',
          visibleSince: null,
        });
        scene?.addChild?.(mesh);
      });

      const fabricSpecs = [
        {
          selector: '[data-section="about"] .about-left',
          colorA: '#fef5b6',
          colorB: '#fbf1a8',
          warm: '',
          period: 94,
        },
        {
          selector: '[data-section="footer"]',
          colorA: '#1a160c',
          colorB: '#1c1b17',
          warm: '#ff9c39',
          period: 139,
        },
      ] as const;

      for (const spec of fabricSpecs) {
        const element = document.querySelector<HTMLElement>(spec.selector);
        if (!element) continue;
        const uniforms: Record<string, { value: unknown }> = {
          uColorA: { value: RGB(spec.colorA) },
          uColorB: { value: RGB(spec.colorB) },
          uWarm: { value: spec.warm ? RGB(spec.warm) : [0, 0, 0] },
          uSize: { value: [element.clientWidth || 1, element.clientHeight || 1] },
          uPeriod: { value: spec.period },
          uDrift: { value: 0 },
          uTime: { value: 0 },
          uRipple: { value: 0 },
          uPointer: { value: [0.5, 0.5] },
          uVelocity: { value: 0 },
        };
        const program = new Program(gl, {
          vertex: sharedVertex,
          fragment: fabricFragment,
          uniforms,
          transparent: false,
          cullFace: null,
          depthTest: false,
          depthWrite: false,
        });
        const mesh = new Mesh(gl, { geometry, program });
        mesh.renderOrder = 10;
        meshes.push({
          element,
          mesh,
          uniforms,
          isFabric: true,
          period: spec.period,
          kind: 'fabric',
          visibleSince: null,
        });
        scene?.addChild?.(mesh);
      }

      contextLossHandler = () => {
        if (document.body.contains(canvas)) {
          // Context loss is fatal for this canvas; cleanup falls back to DOM.
        }
      };
      contextRestoreHandler = () => {
        // The renderer owns the context and re-uploads textures on restore.
      };
      canvas.addEventListener('webglcontextlost', contextLossHandler);
      canvas.addEventListener('webglcontextrestored', contextRestoreHandler);

      const onResize = () => resize();
      window.addEventListener('resize', onResize, false);

      const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1 - (event.clientY - rect.top) / rect.height;
        lastPointer = { x: nx, y: ny, time: performance.now() };
        for (const entry of meshes) {
          if (entry.kind === 'hero') entry.uniforms.uHover.value = 1;
        }
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const frame = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(frame);
        if (!renderer || !camera || !scene) return;
        const now = performance.now();
        const delta = now - lastFrame;
        lastFrame = now;

        // A cheap decayed velocity guards against every animated frame fighting.
        const scrollVelocity = Math.abs(window.scrollY - lastScrollY);
        lastScrollY = window.scrollY;
        const clippedVelocity = clamp(scrollVelocity / 60, 0, 1);
        for (const entry of meshes) {
          place(entry.mesh, entry.element, entry.kind === 'hero');
          if (entry.kind === 'fabric') {
            const rect = entry.element.getBoundingClientRect();
            entry.uniforms.uTime.value = now / 1000;
            entry.uniforms.uVelocity.value = clippedVelocity;
            entry.uniforms.uPointer.value = [lastPointer.x, lastPointer.y];
            entry.uniforms.uRipple.value = clamp((now - lastPointer.time) / 600, 0, 1);
            entry.uniforms.uDrift.value =
              rect.left % entry.period + (now / 1000) * 2.35;
            entry.uniforms.uSize.value = [rect.width, rect.height];
          }

          if (entry.kind === 'hero') {
            const visible = entry.mesh.visible;
            if (visible) {
              if (entry.visibleSince === null) entry.visibleSince = now;
              const elapsed = clamp((now - entry.visibleSince) / 1300, 0, 1);
              const overshoot = 1 + 2.70158 * Math.pow(elapsed - 1, 3) + 1.70158 * Math.pow(elapsed - 1, 2);
              entry.uniforms.uReveal.value = clamp(overshoot, 0, 1);
              entry.uniforms.uHover.value = Math.max(
                0,
                (Number(entry.uniforms.uHover.value) || 0) - delta / 600,
              );
              entry.uniforms.uPointer.value = [lastPointer.x, lastPointer.y];
            } else {
              entry.visibleSince = null;
              entry.uniforms.uReveal.value = 0;
            }
            entry.uniforms.uVelocity.value = clippedVelocity;
            entry.uniforms.uTime.value = now / 1000;
          }
        }

        renderer.render({ scene, camera });
        markReady();
      };

      lastFrame = performance.now();
      frame();

      // Stop after first frame so failed uploads cannot masquerade as ready.
      requestAnimationFrame(() => {
        if (!cancelled) markReady();
      });

      const stopListeners = () => {
        window.removeEventListener('resize', onResize, false);
        window.removeEventListener('pointermove', onPointerMove);
      };
      const oldCleanup = cleanup;
      cleanup = () => {
        stopListeners();
        oldCleanup();
      };

      return cleanup;
    };

    const scheduleIdle = (callback: () => void) => {
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof idleWindow.requestIdleCallback === 'function') {
        const id = idleWindow.requestIdleCallback(callback, { timeout: 1500 });
        return () => idleWindow.cancelIdleCallback?.(id);
      }
      const id = window.setTimeout(callback, 1);
      return () => window.clearTimeout(id);
    };
    cancelIdle = scheduleIdle(() => {
      void init();
    });

    return () => {
      cancelIdle();
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const resource of resources) resource.remove?.();
      for (const entry of meshes) {
        entry.mesh.geometry.remove?.();
        entry.mesh.program.remove?.();
      }
      delete document.documentElement.dataset.glReady;
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas ref={canvasRef} className="gl-stage" aria-hidden="true" data-gl-stage="true" />
  );
}
