# OPENCODE_PROMPTS.md: build order and copy-paste prompts

## How to use this pack

1. Create an empty folder (suggested repo name: `lois-portfolio`), open it in OpenCode, and copy these files into it:
   `AGENTS.md`, `DESIGN_SPEC.md`, `MOTION_SPEC.md`, `OPEN_QUESTIONS.md`, `reference/*`, `scripts/*`.
2. If you use the "impeccable" skill, install it before Phase 1. The prompts below already tell OpenCode that the spec wins over any skill taste.
3. Paste **one phase prompt at a time**. Do not paste several. After each phase OpenCode must run the visual diff and commit.
4. Phases 1 to 11 build the static, pixel-exact site. Phases 12 to 15 add motion and WebGL. Phase 16 to 18 are polish, QA and deploy.
5. If OpenCode can read images, you may additionally attach the PNGs in `/reference`, but it must still follow the numbers.

Before Phase 1, decide the open items in `MOTION_SPEC.md` section 15 (or accept the defaults).

---

## Phase 0: Repo and scaffolding

```
Read AGENTS.md fully, then DESIGN_SPEC.md sections 0, 1, 12 and 13.

Create the project:
- Vite + React 18 + TypeScript (strict) + Tailwind CSS. Install: gsap, lenis, motion, ogl, @fontsource-variable/outfit, @fontsource-variable/fraunces, @fontsource/roboto-mono, clsx. Dev: playwright, pixelmatch, pngjs, sharp, eslint, prettier, typescript.
- Create src/styles/tokens.css with EVERY css variable from DESIGN_SPEC 1.1 exactly, and extend the Tailwind theme to expose them (colors as var(--name), font families ink/outfit/fraunces/mono, radii, the spacing values used by the spec).
- Create @font-face rules for Blauer Nue (400, 500, 600, 700) pointing to /public/fonts/BlauerNue-*.woff2 with font-display: swap and a Lexend/Outfit fallback with size-adjust. If the files are absent, log a warning in OPEN_QUESTIONS.md and continue.
- Create the page shell: App renders nine empty <section data-section="..."> elements in the exact order and with the exact heights from DESIGN_SPEC section 0, using the spec background colors, 1px black borders where specified.
- Add ?static=1 support: a useStaticMode() hook (true when the query param is present or prefers-reduced-motion is set) exposed via context. Nothing else uses it yet.
- Add scripts from /scripts to package.json: "assets:figma", "assets:scrape", "diff".
- Initialize git, add .gitignore (node_modules, dist, .env*, reference/diff), commit "chore: scaffold".
- Then create the GitHub repo and push using the GitHub CLI: gh repo create lois-portfolio --public --source=. --remote=origin --push
  (If I told you a different repo name, use that instead.)

Definition of done: npm run build passes; at 1440 width the page is the correct total height (about 8946px) with the correct section backgrounds; typecheck and lint pass.
Do not build any section content yet.
```

## Phase 1: Assets (Figma export and old-site scrape)

```
Read DESIGN_SPEC section 2 and the two scripts in /scripts.

1. Ask me for FIGMA_TOKEN only if it is not in the environment. Run: FIGMA_TOKEN=... node scripts/figma-export.mjs. This writes the logo SVGs, signpost SVG and CTA blob SVG into src/assets/svg and Figma section renders into reference/figma.
2. Run SVGO on src/assets/svg with settings that preserve viewBox and do not remove fills or strokes. Convert each SVG into a typed React component in src/components/svg/ (Logo with a "variant" prop: "nav" yellow cloud #fef5b6, "footer" white cloud #ffffff; Signpost; CtaBlob; and the icons listed in DESIGN_SPEC section 2: Verified, ArrowRight, ArrowUpRight, LinkedIn, Mail). Icons are 24x24 boxes with 2px black strokes and the glyph sizes in the spec.
3. Run: npx playwright install chromium && node scripts/scrape-projects.mjs --deep. Review src/data/old-site-manifest.json and src/data/old-site-content.json.
4. From the manifest, create src/data/projects.json for the six projects in DESIGN_SPEC 5.5. For each: id, title, titleFont, year, description, tags (verbatim from the spec), accent color from MOTION_SPEC 5.4, and images[] (best-matching images by nearby heading text; order them with the hero/cover image first). Convert images to AVIF and WebP (sharp) with widths 640, 1024, 1600 into public/images/projects/, keep originals out of the final bundle.
5. Pick the four lead images for the hero deck (DESIGN_SPEC 4.2).
6. From old-site-content.json extract: services copy for "Marketing & campaign design" and "Digital & content design" (map into src/data/services.json in the same shape as the Brand identity block in DESIGN_SPEC 7.3), social links, and any real testimonials. Where nothing is found, leave TODO(copy) and add an OPEN_QUESTIONS.md entry. Do not invent copy.

Definition of done: SVG components render; projects.json has all six projects with at least one optimized image each; OPEN_QUESTIONS.md lists any gaps. Commit.
```

## Phase 2: Global layout primitives and Navigation

```
Read DESIGN_SPEC sections 1.3, 1.4, 3 and 12 (nav part).

Build:
- Reusable <Button> (variant props for fill color, label, trailing arrow, width auto) matching DESIGN_SPEC 1.4 exactly: padding 16px 28px, 1px black border, radius 40, label Outfit 400 18/26.1 ls -0.0200em, trailing arrow 24x24 with gap 4.
- <StickerLabel> (rotation prop, fill prop): padding 8px 12px, 0.5px #e9e9e9 border, radius 4, Outfit 400 16/20.16 ls -0.01em.
- <Nav> exactly as DESIGN_SPEC 3: banner (55px, Roboto Mono, bold "Get in touch! 🩵" link), header (115.1px, 1px #2b2b2b bottom border, padding 0 84px, 3 columns gap 96), pills with the exact fills, widths, weights (Services 500) and the arrow only on Contact, centered logo (140.3x75.1) overlapping the vertical padding as specified.
- Mobile menu per DESIGN_SPEC 12 (static version, no animation yet).

Definition of done: run node scripts/visual-diff.mjs and the "nav" section passes at 1440 (at most 1% pixel difference, height 170.1 +/- 1). Fix differences until it does. Commit.
```

## Phase 3: Hero

```
Read DESIGN_SPEC sections 4 and 12 (hero part).

Build <Hero> exactly as specified: padding 84px 40px 64px 72px (content column 1328 wide starting at x=72, so everything is centered at x=736, not 720), H1 box 951x144 with the explicit line break, the card deck container 1328x293.9 at y=268 with FOUR absolutely positioned cards, true size 391x250, radius 36, 1px black border, with the exact rotations (-5.54, +6.69, -3.56, +4.96 deg), exact centers (DESIGN_SPEC 4.2 table), and z-order rising left to right. Paragraph box 924x90 at x=274. Button "See what I do" (#fd9e60) at x=643, y=743.9. Use the four lead images; add data-diff-ignore to the card images.

Definition of done: "hero" passes the visual diff at 1440 (images masked) and the section height is 865.9 +/- 1. Verify the four card centers programmatically (getBoundingClientRect center of each rotated card) against the table to within 1px. Commit.
```

## Phase 4: Selected work

```
Read DESIGN_SPEC sections 5 and 12 (work part).

Build <Work>:
- Background plaid per 5.1 (two subtle repeating gradients), 1px black top/bottom border, padding 76px 64px 64px.
- Sticker label "Selected work" rotated +2.81deg; H2; subtitle with the exact box widths.
- A 2-column grid (644px columns, 24px gaps), cards TOP-ALIGNED (align-items: start) so uneven heights are preserved.
- <ProjectCard> per 5.4: image 644x356 with radius 36 and 1px stroke, body padding 0 40px 40px, title (font per project), year positioned top-right of the title row, description, tag pills (#f5e8ec, radius 32, 12px padding, 6px gap, 24px Verified icon). Render the hidden "View Project" button in the DOM but invisible at rest (opacity 0, pointer-events none, position absolute so layout never shifts) for the later hover phase.
- "More from the portfolio" button #ff8c42 centered with the exact offsets.
- Data from src/data/projects.json. Card heights must reproduce DESIGN_SPEC 5.3 (674/642, 674/676, 644/642) from the real text at 1440, with no fixed heights unless needed to match.

Definition of done: "work" passes the visual diff (images masked) with height 2571.9 +/- 2; assert programmatically that card widths are 644 and heights match the table within 2px. Commit.
```

## Phase 5: Experience

```
Read DESIGN_SPEC section 6.

Build <Experience>: bg #ded1ff, padding 84px 120px, gap 28, Fraunces heading, four 282x330 cards (radius 18, 1px rgba(31,26,26,.25) border, padding 24px 22px, gap 12) at x=120, 420, 720, 1020, with the exact fills and copy from data (src/data/experience.json). Footnote at the specified y.

Definition of done: "experience" passes the diff; height 780 +/- 1. Commit.
```

## Phase 6: Services (static, with working tabs)

```
Read DESIGN_SPEC section 7 and 13 (tabs pattern).

Build <Services>: sticker label "A few ways I can help" (-2deg, #d3c4f7), Outfit 45/50 H2, the folder component:
- three tabs 437.33px wide, no gap, top radius 36, active tab 144px tall (grows upward 20px, merges into the panel, no bottom border), inactive tabs 104px tall sitting 20px above the panel.
- Panel 1312x708 with radius 0 0 36px 36px, background = active tab color, padding 32; inner card 1248x644, #fffef9, radius 36, padding 36, internal layout per 7.2 (title, desc, 1px #dadada divider, two columns of 576 with a 24 gap, meta lines, See what I do button on the right).
- WAI-ARIA tabs (role tablist/tab/tabpanel, arrow keys, Home/End). Default active: tab 1. Content from src/data/services.json. Panel color and content follow the active tab.

Definition of done: with tab 1 active, "services" passes the visual diff except the active-tab/panel mismatch that exists in the Figma reference (the reference shows tab 2 active with tab 1 content; compare against it by temporarily forcing that state via ?tab=2&panel=1 in static mode ONLY for the diff; do not ship that query behavior). Height 1225.9 +/- 2. Commit.
```

## Phase 7: About

```
Read DESIGN_SPEC section 8.

Build <About>: two halves of 720px. Left: vertical stripes (#fef5b6 / #fbf1a8, 47px bands with soft 5px edges) and a 1px black right border, padding 64px 52px 64px 72px; two image cards with TRUE size 593x397.5, radius 36, 1px border, rotated -3.32deg and +1.64deg at the exact centers (369.5, 263.8) and (369.5, 704.5); two cloud badges (logo mark, "the lois.og") at the card corners with rotations +3.32 and -15.12 deg and fills #f5e8ec and #ff9c39. Right: padding 76px 72px 64px 52px, label "About" rotated -5.4deg (#bed35a), H2 (Blauer Nue 45/50), three-paragraph bio verbatim, button "A little more about me" (#ff9c39). Use neutral gray placeholders (data-diff-ignore) where photos are missing.

Definition of done: "about" passes the diff (2x reference is normalized by the script), height 968.2 +/- 1. Commit.
```

## Phase 8: Testimonials

```
Read DESIGN_SPEC section 9.

Build <Testimonials> from src/data/testimonials.json: label (use "Kind words" as documented in 9.3 unless the data says otherwise), H2, and two cards (618x442, #deedfa, radius 36, padding 40px 32px, gap 36) with a 144x129 avatar (radius 24, 1px stroke; fallback to the cloud mark if no avatar), quote (Outfit 24/32) and attribution (Outfit 500 28/44.6).
For the visual diff only, render the exact Figma text for both cards in static mode when no real testimonials exist, and log the placeholder in OPEN_QUESTIONS.md.

Definition of done: "testimonials" passes the diff; height 819.4 +/- 1. Commit.
```

## Phase 9: CTA

```
Read DESIGN_SPEC section 10 and the blob SVG in section 2.

Build <CTA>: bg #deeab3 with 1px black borders, padding 76px 72px 64px, the CtaBlob SVG filling x 64 to 1376 (1312x668) with overflow: visible and vector-effect non-scaling-stroke, centered headline (Outfit 45/50), paragraph (Outfit 26/36, 1055 wide), button at x=561.5 (317x58, #fef5b6) with the exact vertical offsets. Add the contact drawer component (static: a right-side drawer with name, email, "what are you building?", posting to VITE_FORM_ENDPOINT, falling back to mailto). 

Definition of done: "cta" passes the diff; height 828.3 +/- 1. Commit.
```

## Phase 10: Footer

```
Read DESIGN_SPEC section 11.

Build <Footer>: dark stripes (#1a160c/#1c1b17, bands 69.5px, soft edges), padding 76px 72px 64px, gap 96. Left: footer Logo (506.9x271.2, white cloud), four social squares (59.8x52.4, radius 5.69, fills #dbbcff #fbd4e6 #fef5b6 #bed35a, gaps 14.2; LinkedIn, Email and the real socials from old-site-content.json, flagged if missing), copyright (Outfit 28/35.3, #fffef3, with the leading space preserved) and credit line (22/27.7, #cccccc). Right: <Signpost> (SVG pole/ball/base) with FIVE HTML signs 224px wide, padding 16px 20px, radius 8, 1px border, fills/rotations/fonts exactly per the table in 11.2 (Back to Top #ff8c42 0deg, About #dbbcff -5.17, Work #cff5ff +5.15, Services #fbd4e6 -3.15, Get in Touch #fef5b6 +2.05), stacked on the pole, each linking to its section (Back to Top scrolls to top).

Definition of done: "footer" passes the diff; height 716 +/- 1. Commit.
```

## Phase 11: Static freeze and full-page check

```
Run the full visual diff. Make all nine sections pass. Then check programmatically that the full page height is 8946 +/- 8 at 1440 and that no horizontal scrollbar exists at widths 1440, 1280, 1024, 768, 390.
Implement the responsive rules in DESIGN_SPEC section 12 for 1280, 1024, 768 and 390 (static, no motion). Add Playwright screenshots at 390 and 768 into reference/responsive for my review (no diff target).
Tag the commit "static-complete". Do not start motion until this passes.
```

## Phase 12: Motion core

```
Read MOTION_SPEC sections 0, 1, 2, 3, 13 and 14 fully. Use the ?static=1 / reduced-motion gate from Phase 0.

Build, in this order, committing after each:
1. src/motion/ease.ts, quality.ts (tiers + runtime fps guard), MotionProvider.tsx (Lenis wired to the GSAP ticker, plugin registration, reduced-motion handling), useSplit.ts, useMagnetic.ts, useTilt.ts, stitch.ts.
2. <Loader> (2.1) with the logo Flip into the nav and the cloud-shaped mask wipe; first visit only.
3. <Cursor> (2.2) desktop only with the contextual states.
4. Button system (2.5): hover lift, hard shadow, arrow launch, magnetic, press, focus-visible. Apply to every Button.
5. Scroll feel (2.3): velocity skew (desktop high/medium), depth layers (data-depth), section background color bleed via --bg interpolation, section edge wipes (alternating torn-paper zigzag and blob), stitched scroll progress line.
6. Text system (2.4): line mask-rise for all headings, word-opacity scrub for the long copy, with proper SplitText revert/aria.
7. Nav motion (3).

Constraints: no layout shift, transforms/opacity/clip-path only, everything gated by quality tier and reduced motion. After finishing, run the diff with ?static=1 to prove the static design still passes, and record a 10 second screen capture script (Playwright video) scrolling the page for my review.
```

## Phase 13: Section motion passes

```
Read MOTION_SPEC sections 4 to 11 and 12 (mobile). Implement per section, one commit each, in this order: Hero (4.1 to 4.3), Project overlay (4.4, shared by Hero and Work), Work (5.1 to 5.3, 5.5), Experience (6), Services click behavior (7.1, 7.3), About (8, DOM/CSS version), Testimonials (9), CTA (10, SVG blob morph and drawer animation), Footer (11, DOM/CSS version, including the signpost swing physics).

For each section: build the entrance and idle timelines with the named eases, keep the final state identical to DESIGN_SPEC, add the touch/in-view equivalents from section 12, and run the ?static=1 diff. Do NOT implement the pinned stage mode (5.4) yet.
```

## Phase 14: The "wow" moments (Apple-style)

```
Read MOTION_SPEC 2.3, 5.2, 5.4 (do not build 5.4 unless I say "stage mode"), 7.2 and 12.

Implement:
1. The Work section Apple-style card reveal (5.2): perspective unfold, inner image parallax, cut-edge mask reveal, year digit roll, tag pop, and the accent color bloom behind the section.
2. The Services scroll tour (7.2): pin about 260vh, scrub through the three tabs, blob-wipe color morph, 3D turntable rotateY, progress thread, bidirectional sync with clicks (lenis.scrollTo). Disable on mobile/reduced motion.
3. Any remaining scroll-feel polish from 2.3.
Verify no jank: use the Performance panel or a Playwright trace to confirm no long frames over 24ms on a 4x CPU slowdown in the medium tier. Tune until clean.
```

## Phase 15: WebGL layer

```
Read MOTION_SPEC 4.3b, 8 (fabric stripes), 11 (footer cloth), 13 and the gl/ layout in section 14.

Build src/gl/Stage.tsx: a single fixed OGL canvas (pointer-events none) created only for quality tier medium/high and only after requestIdleCallback; it syncs plane geometry to DOM rects each frame (use ScrollTrigger/Lenis scroll values, no layout reads inside rAF except cached rects updated on resize/scroll end).
Implement shaders: (1) HeroCard plane with rounded-rect SDF (radius 36), liquid hover ripple, RGB split on pointer velocity, scroll-velocity UV bend, and the horizontal-stitch curtain reveal; (2) Fabric stripe field shader for About (#fef5b6/#fbf1a8, 47px bands) and Footer (#1a160c/#1c1b17, 69.5px bands) with cursor cloth ripple; (3) optional ProjectDissolve for Work cards that have 2+ images.
Every GL element must degrade to its DOM version (the DOM element stays in place; GL hides it only after the texture is ready and the first frame has rendered). Textures at most 1024px long edge, DPR clamp 1.5, render only when visible, dispose on unmount, handle context loss.
Verify with ?static=1 that GL is fully off and the diff still passes.
```

## Phase 16: Mobile and touch pass

```
Read MOTION_SPEC section 12. Test with Playwright mobile emulation (iPhone 14, Pixel 7) and CPU slowdown. Implement: Lenis off on touch, snap-scroll hero deck with optional gyroscope tilt (permission on first tap with a "Tilt me" sticker), in-view hover substitutes, shorter reveal distances, gated haptics, GL tier rules. Fix any overflow, tap-target (44px), or performance issue. Provide screenshots at 390x844 of every section.
```

## Phase 17: QA

```
1. Visual diff: all nine sections pass at 1440 with ?static=1.
2. Lighthouse (mobile and desktop): Performance 90+, Accessibility 100, Best Practices 100, SEO 100. Report LCP, CLS, INP.
3. Accessibility: keyboard-only walkthrough (skip link, nav, tabs, drawer focus trap, overlay focus trap and Esc), axe checks with no serious issues, reduced-motion behavior verified, color contrast.
4. Cross-browser smoke: Chromium, WebKit, Firefox via Playwright (page loads, no console errors, hero deck and services tabs work).
5. SEO and share: title "Lois Amadi | Brand and visual designer", meta description from the old site, Open Graph image (use the og image from the old site meta or generate 1200x630 from the hero), favicon from the cloud logo, sitemap and robots.
6. Remove unused dependencies and dead code. Report bundle sizes.
List every remaining TODO(spec)/TODO(copy)/TODO(content) from OPEN_QUESTIONS.md for me to resolve with Lois.
```

## Phase 18: Deploy

```
1. Add vercel.json (SPA rewrite to index.html, long-cache headers for /assets and /fonts and /images).
2. Ensure the git remote is the GitHub repo (gh repo view). Push main.
3. Deploy: npx vercel --prod (link the project; set VITE_FORM_ENDPOINT if I provide one). If I prefer GitHub integration, tell me to connect the repo in the Vercel dashboard instead.
4. Print the production URL and run Lighthouse against it. Report results.
```

---

## Optional prompts

**Stage mode (only if approved):** "Implement MOTION_SPEC 5.4 behind a feature flag `?stage=1` with the default still the grid."

**Case study pages:** "Add `/work/:slug` pages using the same overlay content as a full page with a Flip-based shared-element transition from the card."

**Visual polish loop:** "Compare the live page at 1440 against /reference/figma full-page render. List every section where measured layout differs by more than 2px (use getBoundingClientRect on named elements) and fix them."
