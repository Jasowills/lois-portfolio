# AGENTS.md: Lois Amadi portfolio ("the lois.og")

You are building a brand designer's portfolio as a **pixel-exact replica of a Figma design**, then adding high-end motion and WebGL on top. You cannot see images, so the numbers in `DESIGN_SPEC.md` are your eyes. Trust them over any instinct or design-skill taste.

## Source-of-truth order (highest wins)
1. `DESIGN_SPEC.md`: layout, colors, type, sizes, copy, positions. Never deviate. Never "improve".
2. `MOTION_SPEC.md`: animation and interaction. Static state must always equal DESIGN_SPEC.
3. This file: process and code rules.
4. Any installed design skill (such as "impeccable"): use it for polish **inside** the spec (easing quality, hover states, accessibility, micro-detail). If a skill suggests changing a color, font, size, radius, spacing, copy or layout from the spec, **ignore the suggestion**.

If a value is missing or ambiguous: do not invent it. Add an entry to `OPEN_QUESTIONS.md` with the section, the missing value, and what you used as a temporary placeholder, then continue.

## Stack
Vite, React 18, TypeScript (strict), Tailwind CSS, GSAP 3 (ScrollTrigger, SplitText, Flip, Draggable, MorphSVGPlugin, CustomEase, Observer), Lenis, `motion` (motion/react), OGL for WebGL. Package manager: npm. Node 20+. Deploy target: Vercel.

## Hard rules
- **Tokens only.** All colors, fonts, radii and spacing come from CSS variables / Tailwind theme extended from DESIGN_SPEC section 1. No raw hex or magic numbers inside components (the only exceptions are exact geometry values from the spec tables, kept in a per-component `const SPEC = {...}` object with a comment citing the spec section).
- **Exact fonts.** Blauer Nue, Outfit, Fraunces, Roboto Mono exactly as in DESIGN_SPEC 1.2. Never substitute silently. If Blauer Nue files are missing, use the fallback stack and log it.
- **Letter-spacing** is converted from px to em (`px / fontSize`).
- **Content as data.** Projects, services, experience and testimonials live in `src/data/*.json` and render through components. Copy is verbatim from the spec.
- **No layout shift.** Reserve space for everything animated. No animating layout properties (width/height/top/left/margin). Transforms, opacity, clip-path and shader uniforms only.
- **Static first.** With `?static=1` or `prefers-reduced-motion`, the page renders the exact static design with zero motion, no loader, no cursor, no WebGL. `scripts/visual-diff.mjs` relies on this.
- **One owner per property.** GSAP: scroll, timelines, scrub, Flip. Motion: component hover/tap/presence/springs. Lenis: scroll position. Never animate the same property with two systems.
- **Accessibility is not optional.** Semantic HTML, WAI-ARIA tabs for services, visible focus rings (3px black with 2px `#fef5b6` offset), alt text, skip link, keyboard navigable, reduced-motion respected.
- **Performance budgets.** Initial JS under 250KB gzip excluding the lazy GL chunk. LCP under 2.5s. CLS under 0.05. Lazy-load WebGL after first paint. Images AVIF/WebP with `srcset`.
- **No em dashes** in any copy, comments or docs you write (use commas, colons or hyphens). Verbatim spec copy is already clean.
- **Do not add features, sections, pages, libraries or copy** that are not in the specs. Ask via `OPEN_QUESTIONS.md`.

## Section markers (required)
Every section root element carries `data-section="nav|hero|work|experience|services|about|testimonials|cta|footer"`. Elements whose pixels come from project photography carry `data-diff-ignore` so the visual diff can mask them.

## Work protocol
1. Work one phase at a time (see `OPENCODE_PROMPTS.md`). Read the cited spec sections fully before writing code.
2. After each phase: run typecheck, lint, build, and `node scripts/visual-diff.mjs`. Fix until the section passes (at most 1% pixel difference with images masked, and no height mismatch).
3. Commit after each phase with a conventional message (`feat(hero): ...`). Never commit secrets (`.env*`, tokens).
4. When a phase is done, print: what you built, what the diff reported, and any new `OPEN_QUESTIONS.md` entries.

## Directory layout
```
/reference            Figma PNG exports (read-only), /reference/diff generated
/scripts              figma-export.mjs, scrape-projects.mjs, visual-diff.mjs
/public/fonts         woff2 files
/public/images        projects (from scrape), og image
/src/assets/svg       logo, signpost, blob
/src/data             projects.json, services.json, experience.json, testimonials.json
/src/styles           tokens.css, base.css
/src/components       Nav, Hero, Work, Experience, Services, About, Testimonials, CTA, Footer, ...
/src/motion           see MOTION_SPEC section 14
/src/gl               see MOTION_SPEC section 14
```
