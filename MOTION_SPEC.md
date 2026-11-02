# MOTION_SPEC.md: Animation, WebGL and interaction script

Status: **v1 for approval.** Everything here is a decision to confirm or cut. Sections are tagged:
- **[CORE]** ship in the first motion pass
- **[WOW]** the hero-level moments, built after CORE is stable
- **[GL]** WebGL, lazy-loaded after first paint, always with a DOM fallback

Brief: this is a brand designer's portfolio. The site should feel handmade, tactile and surprising, and look expensive doing it. The world is **stickers, paper, thread and signage**: outlined shapes, hard shadows, tilted cards, a signpost. Lois started in fashion and sews, so **fabric, stitching and cutting** are the visual metaphors that make the motion personal instead of generic. Motion should be physical (squash, spring, swing, peel, stitch), never a plain fade.

The Figma design (DESIGN_SPEC.md) is the static truth. Motion must start from and settle back into those exact static values. The page must look pixel-correct with all JS motion disabled.

---

## 0. Principles and guardrails

1. **Static first.** Final resting state of every element equals DESIGN_SPEC. Animations are `from` states, not different layouts.
2. **One owner per property.** GSAP owns scroll, timelines and anything scrubbed. Motion (motion/react) owns component hover, tap, layout and route/presence. Lenis owns scroll position. CSS owns simple color/shadow transitions. Never animate the same property from two libraries.
3. **Transforms and opacity only** for continuous animation. No animating width/height/top/left. Use `clip-path`, `transform`, `opacity`, `filter` (sparingly), and shader uniforms.
4. **Budget:** 60fps on a mid-range phone. If a frame budget is blown (see 11), degrade automatically.
5. **Reduced motion:** with `prefers-reduced-motion: reduce`: no Lenis smoothing, no parallax, no pinned scrub, no WebGL, no cursor blob. Keep only instant state changes and 150ms opacity fades. Provide the same content and links.
6. **Never block content.** Nothing hides critical text if JS fails. Initial hidden states are applied by JS in `useLayoutEffect` after hydration (or via a `.js` class on `<html>`), never in static CSS.
7. **Sound:** none.

### Named easings (define once in `src/motion/ease.ts`)
```
snap        cubic-bezier(.2, .9, .2, 1)        // UI responses
pop         cubic-bezier(.34, 1.56, .64, 1)    // stickers, pills overshoot
glide       cubic-bezier(.16, 1, .3, 1)        // entrances (expo out)
swing       CustomEase "M0,0 C.2,0 .1,1.4 .45,1.1 .7,.92 .85,1.03 1,1"   // damped swing for signs
squash      CustomEase for scaleX/scaleY pairs (see logo)
```
Durations: micro 0.18 to 0.3s, hover 0.35s, entrance 0.8 to 1.2s, section transitions 0.9 to 1.4s, stagger 0.05 to 0.09s.

---

## 1. Stack

| Concern | Library | Notes |
|---------|---------|-------|
| Framework | Vite + React 18 + TypeScript | static SPA, deploys to Vercel |
| Styling | Tailwind CSS (theme from DESIGN_SPEC tokens) | CSS variables for all colors |
| Smooth scroll | **Lenis** | `lerp` 0.09 desktop, native scroll on touch (see 10) |
| Timelines, scroll | **GSAP 3** + ScrollTrigger, SplitText, Flip, Draggable, MorphSVGPlugin, CustomEase, Observer | all plugins are free in current GSAP |
| Component motion | **motion** (`motion/react`) | hover, tap, presence, layout, springs |
| WebGL | **OGL** (tiny) with custom GLSL, one shared canvas | fallback to DOM images |
| Physics (optional) | none; use GSAP damped easings | avoid heavy physics libs |

Wire Lenis into GSAP's ticker: `gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); lenis.on('scroll', ScrollTrigger.update)`.

A single `<MotionProvider>` boots Lenis, registers GSAP plugins, exposes `useReducedMotion()`, `useScrollVelocity()` and the quality tier (section 11).

---

## 2. Global systems

### 2.1 Intro loader [CORE]
Duration about 1.6s, skipped on repeat visits in the same session (`sessionStorage`) and under reduced motion.
1. Cream screen. The **yellow cloud logo** (nav version, scaled to 2.2x) inflates from 0 with squash and stretch: scaleY 1.18 / scaleX 0.86 for 0.18s, then settle with `pop`. The little **sparkle** above the "i" twinkles (rotate 45deg, scale 0 to 1.2 to 1, 0.4s).
2. The logo **flies** to its nav position using GSAP Flip (shared element) while the cream cover is removed with a **cloud-shaped mask wipe**: use the CTA blob path as a `clip-path` / SVG mask that scales from 0 to 2.4x from the logo center, revealing the page.
3. Page content then runs its entrance timelines (staggered, see per-section).
Fonts must be loaded (`document.fonts.ready`) before the loader ends; hard timeout 2.5s.

### 2.2 Custom cursor [CORE, desktop pointer:fine only]
A 14px black dot plus a 44px trailing **blob** (an SVG circle with 8 control points whose radius wobbles with velocity, drawn with a spring). The blob morphs by context:
- default: 14px outlined circle (1px black) following with lag 0.12
- over links/buttons: grows to 64px, fill `#fef5b6`, mix-blend multiply, arrow glyph appears
- over project cards: becomes a 96px **"View"** pill in `#ff9c39` with label
- over draggable (hero deck, experience row): **"Drag"** with left/right chevrons
- over text selections or inputs: reverts to system caret
Hide on touch devices. Never replace the cursor inside forms. Keep `cursor:pointer` semantics for accessibility.

### 2.3 Scroll feel: "the whole screen moves" [WOW]
Goal: scrolling should feel like moving a camera through a physical set, not scrolling a document.
- **Velocity skew:** a wrapper applies `skewY` of `clamp(velocity * 0.0012, -1.6, 1.6)deg` and `scaleY` 1 to 1.004 with smoothing, settling with `glide`. Only on desktop. Section content (not text blocks smaller than 28px) skews; body copy never skews.
- **Depth layers:** each section defines layers with `data-depth` (-0.2 to 0.4). Backgrounds move slower, stickers and badges faster, creating parallax. Implemented with ScrollTrigger `scrub:true` on `yPercent`.
- **Section color bleed:** the page background (`body`) is a CSS variable `--bg` that interpolates between adjacent section colors as the boundary crosses the viewport center (hero `#fffce6` to work `#e4d9fe` to experience `#ded1ff` to services `#fffef9` to about to testimonials to CTA `#deeab3` to footer `#1a160c`). Use ScrollTrigger `onUpdate` to lerp colors. Section borders (1px black) stay crisp on top.
- **Section handoffs:** each section boundary has a **torn-paper / scissors-cut edge** (a zigzag `clip-path: polygon(...)` with 24px teeth that wipes in over 0.9s as the next section enters), alternating with **blob-edge** wipes using the CTA blob path. The shape language alternates so it does not feel templated. Keep the 1px black border following the edge via an SVG overlay stroke, or use a plain straight edge on reduced tiers.
- **Scroll progress:** a 4px stitched dashed line (SVG `stroke-dasharray: 8 6`) fixed to the viewport top, drawing in `#000` as you scroll, with a tiny needle glyph at its head. Click to jump to top.
- **Snap moments:** soft ScrollTrigger snap only around the pinned services tour (section 7), never on the whole page.

### 2.4 Text system [CORE]
All headings use SplitText by lines with a mask (`overflow:clip` on lines): lines rise from `yPercent:110` with 4 deg rotation, stagger 0.08, `glide`, triggered at `top 85%`. Body copy reveals by **word opacity scrub** (about, experience intro): words go from 0.18 to 1 opacity as they pass the 70% viewport line. Re-split on resize with `autoSplit` and revert for reduced motion. Never leave `aria-hidden` splits: keep the original text readable by assistive tech (use SplitText `aria: "auto"`).

### 2.5 Buttons and pills [CORE]
All buttons share one behavior (Motion springs):
- Rest: as designed.
- Hover: lifts `y:-3`, hard shadow `4px 4px 0 #000` fades in (the outline world needs a shadow to feel like a sticker), the arrow slides out up-right and a copy slides in from bottom-left (arrow "launch"). Color **sweep**: a lighter overlay wipes left to right (clip-path) in 0.35s.
- Magnetic (desktop): button translates up to 10px toward the cursor within 90px radius, with `spring {stiffness:200, damping:15}`.
- Press: scale 0.96, shadow collapses to 0.
- Focus-visible: same as hover plus the focus ring.

### 2.6 Page transitions [WOW]
Hash/anchor navigation between sections uses `lenis.scrollTo` with duration 1.4 and `glide`, with a brief blob wipe overlay only for "Back to Top" (squash the logo). Project detail opens (see 4.4) use Flip, not route reloads.

---

## 3. Navigation [CORE]

- **Banner:** on load the text types in character by character (mono font suits it), caret blinks twice. The heart emoji does a heartbeat scale pulse (1 to 1.25, 0.6s) every 6s.
- **Pills:** each pill has a resting micro-wobble of +/-0.6deg on a 4s sine loop with different phase per pill. Hover: straightens to 0deg, lifts, shadow, and for Services/Work/About a **right arrow slides in** and the pill widens by 28px using `layout` (Motion) so neighbors shift smoothly. Contact already has its arrow, which nudges 4px on hover.
- **Logo:** on hover, **squash and stretch** (scaleX 1.08, scaleY 0.92, then 0.96/1.06, then rest, `squash` ease) and the sparkle spins. On click scrolls to top.
- **Header behavior:** hides on scroll down (translateY -100%) and returns on scroll up. The 1px bottom border stays as designed. No floating dock.
- **Active section indication:** the pill matching the current section gets weight 500 (matches the Figma Services emphasis) and a 6px black dot beneath it.
- **Mobile menu:** full-screen sheet; the four stickers drop in from above with gravity (`swing`, stagger 0.08), each landing at a different tilt; the purple "Let's Talk!" pill pops last.

---

## 4. Hero [CORE + WOW + GL]

### 4.1 Entrance timeline
1. H1 lines mask-rise (2.4 text system), 0.9s.
2. **Card deal:** the four cards start stacked at the center of the container (all at x=center, rotation 0, scale 0.7, `y:60`, opacity 0). They fly to their final positions and tilts with a staggered arc (`stagger 0.12`, `back.out(1.5)` for rotation), landing like cards thrown on a table. Each card casts a hard shadow `6px 6px 0 #000` for 0.3s on landing then fades to none (matches the flat design at rest).
3. Paragraph words fade/rise in a 0.02 stagger. Button pops (`pop`).

### 4.2 Idle life
- Cards breathe: `y` +/-4px and rotation +/-0.4deg on offset 5 to 7s sine loops. Pauses when the tab is hidden or the section is off-screen.
- Cursor parallax (desktop): cards translate by up to 14px opposite the pointer, with depth multipliers 0.6, 1.0, 1.4, 0.8 (cards at different z feel layered).

### 4.3 Interaction on cards
- **Hover a card:** it straightens toward 0deg (rotation x0.2), scales to 1.06, comes to the front (z-index swap via GSAP, no layout jump), neighbors slide away 24px horizontally and dim to 0.9 brightness. A **stitched dashed outline** (SVG rect, `stroke-dasharray: 10 8`, color `#000`, 2px) **draws around the card** like thread being sewn (stroke-dashoffset animates over 0.7s, a small needle glyph travels along the path). Cursor becomes "View".
- **Image inside:** inner `<img>` scales 1.12 to 1.0 on entrance, and shifts opposite the pointer by 12px (inner parallax) for depth.
- **Click:** the card **expands to the project overlay** (see 4.4).
- **Drag (Draggable):** the deck can be dragged horizontally on desktop with inertia; cards reorder z-index as they cross. Release springs the deck back to the layout. On touch it is a normal scroll-snap row.
- **Scroll-linked:** as the hero scrolls out, cards **fan out** (rotation x1.6, spread +30px) and drift at different speeds (parallax), then clear.

### 4.3b WebGL upgrade [GL] (progressive enhancement)
Replace the four card images with OGL planes on the shared canvas, aligned to the DOM rects (DOM `<img>` stays for SEO/fallback and is hidden when GL is active). Shader features:
- **Rounded-rect SDF mask** matching radius 36 so edges are exact; the 1px black outline stays as a DOM border overlay.
- **Liquid hover:** on hover, a displacement ripple emanates from the cursor (noise-driven UV warp, 0.6s decay), with subtle chromatic split (R/G/B offset up to 2px) that peaks on fast pointer movement.
- **Scroll velocity warp:** UVs bend along y with velocity, so images feel like fabric tugged by the scroll.
- **Reveal:** entrance uses a **curtain of horizontal stitches** mask: thin horizontal strips (24 of them) unveil with staggered offset, like fabric lifting.
Keep texture size at most 1024px on the long edge; DPR clamp 1.5.

### 4.4 Project overlay (shared by Hero and Work cards) [WOW]
Click expands the card using **GSAP Flip**: the card's image morphs into a full-viewport hero (radius 36 to 0 over the first 60%), the page behind blurs (`backdrop-filter: blur(12px)`, 0.4s) and dims, the title and meta slide in with SplitText, a carousel of that project's images becomes a horizontal scroll/drag gallery, and a **"Close" sticker** (rotated -4deg) pops at the top right. Esc and swipe-down close; closing reverses the Flip. If no case study content exists yet, the overlay shows the image gallery plus the project summary and tags (scraped data), with a "Case study coming soon" sticker.

---

## 5. Selected work [CORE + WOW + GL]

### 5.1 Header
Sticker label **slaps in**: scale 2 to 1 with rotation -20deg to +2.81deg, `pop`, plus a tiny paper-shadow that flashes then disappears. H2 mask-rise, subtitle word scrub.

### 5.2 Apple-style card reveal [WOW]
The grid layout stays exactly as designed (2 columns, uneven heights). The **reveal** is cinematic:
- Each card enters from `scale:0.86, rotateX:14deg, y:120, opacity:0` with `transformPerspective:1200`, `transformOrigin: "50% 100%"`. As it scrubs through the viewport (`top 95%` to `top 45%`) it unfolds to flat like a product card being raised. Left and right cards in the same row have 0.1s stagger and mirrored tilt (rotateY +/-6deg) that resolves.
- The card **image is a window**: the `<img>` inside scales 1.35 to 1.0 and `yPercent:-8` to 8 while the card traverses (parallax), so the picture feels deeper than the frame. Combined with an **image mask reveal** (clip-path inset from `0 0 100% 0` upward with a zigzag "cut" edge, 0.9s).
- Title/year/description reveal in sequence: title lines rise, year counts up from 2020 to its value in 0.6s (digit slot-machine), description by lines, tags **pop in one by one** (scale 0.6 to 1, `pop`, stagger 0.07) with their check icon drawing its stroke.
- **Section background reacts:** each card has a `data-accent` (see 5.4). As a card reaches center, a soft full-section **radial color bloom** (CSS gradient, `opacity .0 to .35`) in that accent color blooms behind it and morphs to the next card's accent as scroll continues (this is the Apple "product color change" feel). It tints but never overrides the plaid base.

### 5.3 Hover (desktop) / in-view (touch) [CORE]
- Card lifts `y:-8`, hard shadow `8px 8px 0 #000`, tilt follows pointer (+/-4deg 3D, `transformPerspective:900`, spring). A glare highlight (diagonal white gradient at 12% opacity) tracks the pointer.
- The hidden **"View Project ↗"** button (`#ff9c39`) **peels in**: appears over the bottom-left of the image (so the card height never changes), sliding from `x:-20, rotate:-8deg` to rest with `pop`.
- The **stitched outline** draws around the card (same technique as 4.3). Tags do a 1-pass wave (y -3 then 0, stagger 0.04).
- Image: slow zoom to 1.06; on supported devices swap to a **WebGL displacement dissolve** to a second image of the project (if `images.length > 1`).
- Cursor: "View".

### 5.4 Pinned showcase mode (optional, behind `?stage=1` and a feature flag) [WOW, decision needed]
An alternative Apple-keynote version of the same content for approval, not default (it breaks 1:1 layout):
- Section pins for about 600vh. One large project card (image about 80vw by 70vh) sits center. Scrolling **morphs** the image to the next project through a WebGL displacement dissolve, the card's accent color floods the background in a circular reveal from the cursor position, title/description swap with SplitText masks, a big counter `01 / 06` rolls like an odometer, and tags re-stagger. After project 6 the stage unpins and settles into the 2-column grid (cards Flip from stage positions to grid positions).
Decision for Lois and Jason: default grid (current), or stage mode.

Per-project accent colors (use these, they come from the design palette):
A Garri & Granola `#fef5b6`, B Heure Dorée `#fbc4df`, C Rika Trips `#deedfa`, D Africa Built `#bad892`, E Fintech Is Easy `#dbbcff`, F Gourmet Guide `#ff8c42`.

### 5.5 "More from the portfolio" button [CORE]
On entering view it **drops in** with a bounce (gravity), then idle: arrow bobs 3px every 2.5s. Click opens a full "archive" overlay (same overlay system as 4.4) or navigates when the archive exists. Until the archive exists link to the old site (trulylois.work).

---

## 6. Experience [CORE + WOW]

- Label types in (mono-like letter reveal), H2 uses Fraunces so animate **per-word with a soft italic-skew settle** (skewX -6deg to 0) for a serif editorial feel. Intro word scrub.
- **Cards as a hand of cards:** at rest on scroll-in they are stacked and fanned (rotation -9, -3, +3, +9deg, overlapping by 90px, `transform-origin: 50% 120%`). As the section scrubs (`top 80%` to `top 40%`) they **straighten and spread** into the grid positions, one after another (stagger 0.15), each flipping a quarter turn (rotateY 40deg to 0) as it settles.
- **Hover:** card lifts 10px, fill deepens 6% (darken via `color-mix`), the title's first letter swaps to a tiny **hat sticker** (the section is "creative hats"): a 28px rotated sticker pops over the top right corner (different per card: cap, top hat, beret, bobble; simple outlined SVGs in the brand palette). Hat sways -6 to +6deg on a 1.4s loop while hovered.
- **Touch:** horizontal scroll-snap row with the same fan on enter.
- **Footnote:** a thread line (dashed stroke) draws under "The hat changes with the brief." as the text word-scrubs in.
- Cursor over the row: "Drag" on desktop if the row overflows (it does not at 1440, so only below 1200).

---

## 7. Services: the "feature tour" [WOW]

This is the Apple product-change moment, reinterpreted: the panel is the product; the services are its configurations.

### 7.1 Static behavior (click)
- Click a tab: the tab **rises** (y -20, height +40 via clip/transform, never layout thrash: animate `scaleY` on a pseudo background and shift text with transforms), the previously active tab drops. The panel color **morphs** to the tab color using a **blob wipe**: an SVG blob (CTA blob path scaled) expands from the clicked tab's center to fill the panel in 0.7s, then becomes the new background. Inner card contents transition with SplitText masks: old lines slide up and out, new lines slide up in, list items stagger (0.04), bullets draw in.
- Arrow keys switch tabs (ARIA tabs). Auto-advance only in tour mode.

### 7.2 Scroll tour (desktop, tablet landscape) [WOW]
When the folder enters the viewport center, the section **pins** for about 260vh. Scroll position scrubs through the three services:
- 0 to 33%: Brand identity (active). 33 to 66%: Marketing. 66 to 100%: Digital.
- Each transition runs the blob wipe, the folder subtly **rotates in 3D** (rotateY -4deg to 4deg, `transformPerspective:1600`, like an Apple product turning on a turntable), and the tabs' height changes follow.
- A thin **progress thread** (dashed line) at the bottom of the panel fills across.
- Clicking a tab jumps scroll to that stage (`lenis.scrollTo`), keeping scroll and state in sync. On exit, the pin releases and the folder settles flat (rotateY 0).
- On mobile or if reduced motion: no pin; tabs are plain click targets.

### 7.3 Details
- "What's included" bullets: each bullet dot **stamps** in (scale 2 to 1, black) with a tiny 1px offset shadow.
- "See what I do" button follows button system 2.5.
- Meta chips (TIMELINE, PROJECT SCOPE) slide in from left with a tape-label feel (rotate -1deg to 0).

---

## 8. About [CORE + WOW + GL]

- **Stripe field** (left half): the vertical stripe pattern **drifts** horizontally at 6px/s and, in GL tier, is a shader that gently **ripples like fabric** (sine displacement along x, amplitude 6px, reacting to cursor like cloth pressed by a finger). DOM fallback: CSS `background-position` animation, 40s linear loop.
- **Two image cards** tilted (-3.32deg and +1.64deg): on scroll they scrub in from opposite sides (x -80, +80) with extra rotation (+/-8deg) to final, then lock. On hover each straightens toward 0deg, lifts 10px, and the **cloud badge peels** (3D curl: the badge rotates about its corner by 18deg with a shadow growing, like a sticker lifting off). Clicking a card opens it in the overlay (4.4).
- **Cloud badges** idle: gentle float (y +/-3px, 3 to 4s, offset). On hover, **squash** like the logo.
- **Label "About"** slaps in. **H2** mask-rise. **Bio** word-opacity scrub (three paragraphs; the final sentence "mentally redesigning a sign I passed on the way here" gets a hand-drawn **underline stitch** on the word "sign" as a wink).
- **Easter egg:** hovering the word "sewing" in the bio makes a small **needle** sticker pop and a dashed thread line draw to the next word. Purely decorative, aria-hidden.
- Button: system 2.5.

---

## 9. Testimonials [CORE + WOW]

- Label slap-in, H2 mask-rise.
- **Cards:** two cards enter from below with opposite tilts (+/-3deg) that settle to 0, 3D tilt on pointer (+/-5deg), avatar frame (radius 24) does a small **pop and wobble** when its card enters.
- **Carousel behavior:** with more than 2 testimonials the row becomes a draggable carousel (Draggable + inertia, snap) with the cursor in "Drag" mode; cards at the edges scale 0.94 and tilt 2deg. Auto-advance every 7s paused on hover/focus.
- Quote reveal: words typeset in by line (SplitText) as the card settles; the attribution has a hand-drawn **highlighter swipe** (yellow `#fef5b6` bar scaleX 0 to 1 behind the name, 0.5s).
- Data-driven: `testimonials.json`; avatars are optional (fall back to the cloud logo mark).

---

## 10. CTA [CORE + WOW + GL]

- **Blob morph [WOW]:** the blob path continuously morphs between 4 hand-tuned variants (generated by moving the existing control points by +/-24px), using GSAP **MorphSVGPlugin**, each 4s `sine.inOut`, yoyo loop. The stroke stays 1px (vector-effect: non-scaling-stroke).
- **Cursor liquid:** the blob's nearest control points are pulled toward the pointer (up to 40px) with a spring, so the blob **leans toward the cursor** and wobbles back. On touch, it reacts to scroll velocity instead.
- **Entrance:** the CTA section background (`#deeab3`) **circle-wipes** in from the previous section's bottom edge; the blob inflates from 0.2 to 1 (elastic) as the headline lines rise.
- **Button:** magnetic and color-sweep (system 2.5), plus a **confetti of stickers** (8 tiny outlined shapes in the palette: stars, hearts, circles) burst on click before opening the contact flow (mailto or a form drawer).
- **Contact drawer [CORE]:** clicking opens a right-side drawer (or bottom sheet on mobile) with a simple form (name, email, "what are you building?"), posting to a form endpoint (Formspree or similar; env var `VITE_FORM_ENDPOINT`). Until configured it falls back to `mailto:`. Animation: slides with `glide`, fields stagger in.
- [GL, optional] cursor trail as soft metaballs inside the blob using a single fullscreen quad shader limited to the blob bounds. Skip if time is short.

---

## 11. Footer [CORE + WOW + GL]

- **Stripe field:** dark stripes (`#1a160c`/`#1c1b17`) slowly drift; GL tier: cloth shader like About, darker, with a faint warm highlight following the cursor (like a lamp over fabric).
- **Logo:** huge cloud logo (white). On hover it squashes and its **sparkle** emits 3 small sparkles that float up and fade. Entering view: it inflates with `elastic.out(1, .5)`.
- **Social squares:** pop in with stagger; hover: square jumps (`y:-8`) and rotates +/-6deg, icon spins 360 on click; each has a distinct tilt resting at 0.
- **Signpost [WOW]:**
  - Pole and ball draw in (ball scales with squash, pole `scaleY` from top).
  - The five signs **drop in** from above with gravity, one by one (stagger 0.12), each landing with a damped **swing** (rotation overshoot via `swing` ease, ending at its Figma rotation: 0, -5.17, +5.15, -3.15, +2.05 deg), transform-origin at the pole-side edge (center-left of the sign where it would be bolted).
  - Hover a sign: it swings (rotate +/-8deg damped, 0.9s), brightens 6%, shadow appears, cursor shows an arrow. Click: it **flaps** (rotateX 90deg and back, 0.35s) then scrolls to its section.
  - Idle: very small wind sway on all signs (+/-0.6deg, 5s, offsets), more when scroll velocity is high.
  - **Draggable [optional fun]:** signs can be flicked; they swing on release and return.
- Copy lines: lines mask-rise, the "No pixels were harmed" line has a tiny **pixel-pop** (a pixel burst of 6 squares) on hover.
- **Back to Top** scrolls with `lenis.scrollTo(0, {duration: 1.6})` while the signs sway and the nav logo squashes on arrival.

---

## 12. Mobile and touch

Impress on mobile too. No hover; replace with **in-view** and **tilt**.
- **Lenis off** on touch (native momentum is better); keep ScrollTrigger scrub and reveals.
- **Hero:** snap-scroll deck; cards tilt with **gyroscope** (`DeviceOrientationEvent`, request permission on first tap with a tiny "Tilt me" sticker; fall back to idle breathing). Drag/fling works.
- **Work cards:** unfold reveal (5.2) with shorter distances (y 60), hover states fire when the card is within the middle 40% of the viewport (`ScrollTrigger` onToggle): stitched outline draws, "View Project" peels in.
- **Services tour:** no pin; tabs swipeable; blob wipe on change.
- **Footer:** signs drop and swing on enter; tap triggers swing and flap.
- **Haptics:** `navigator.vibrate(8)` on sticker pops and tab changes where supported, throttled.
- **GL tier:** off by default on mobile unless the device is high tier (section 13); DOM images fall back.
- Touch targets at least 44px; no animation relies on hover to expose navigation.

---

## 13. Performance, quality tiers, fallbacks

Compute `quality` once at boot (`src/motion/quality.ts`):
- `high`: desktop GPU capable, `deviceMemory >= 8` or `hardwareConcurrency >= 8`, no `saveData`. All features.
- `medium`: default. GL only for hero cards; no skew; no pinned showcase; reduced counts.
- `low`: mobile low memory, `saveData`, or measured fps < 40 for 2s. No GL, no skew, no cursor, no blob morph (static blob), minimal stagger.
- Runtime guard: a rolling 60-frame average of `gsap.ticker` delta; if > 24ms, step down one tier (and never step up in a session).
- Pause everything off-screen: ScrollTrigger `onToggle` plays/pauses idle loops, GL planes skip render when outside viewport. Pause on `document.hidden`.
- Lazy-load GL code and textures after `requestIdleCallback` (timeout 1.5s) and after LCP.
- Images: AVIF/WebP with `srcset`, intrinsic dimensions, `fetchpriority="high"` on the first hero image only; others `loading="lazy"`.
- JS budget: initial route under 250KB gzip excluding GL chunk; code-split GL and the overlay.
- Core Web Vitals targets: LCP under 2.5s, INP under 200ms, CLS under 0.05. Reserve layout for every animated element (no layout shift from reveals).
- `will-change` only during an active animation, removed after. No more than 20 layers promoted at once.

---

## 14. File and module layout

```
src/
  motion/
    ease.ts            // custom eases
    quality.ts         // tier detection + runtime guard
    MotionProvider.tsx // Lenis + GSAP boot, reduced motion
    useSplit.ts        // SplitText helper (lines/words, revert)
    useMagnetic.ts
    useTilt.ts
    stitch.ts          // dashed-outline "sewing" draw util
    blob.ts            // morph variants + cursor pull
  gl/
    Stage.tsx          // single OGL canvas, rect sync, lazy
    planes/ HeroCard, ProjectDissolve, Fabric
    shaders/ *.glsl
  components/
    Nav, Hero, Work, Experience, Services, About, Testimonials, CTA, Footer, Overlay, Cursor, Loader, ContactDrawer
  data/ projects.json, services.json, testimonials.json, experience.json
```

---

## 15. Decisions needed before build (answer these)

| # | Decision | Default |
|---|----------|---------|
| 1 | Work section: default grid (1:1) or pinned stage mode (5.4) | grid |
| 2 | Services scroll-tour pin (7.2) on desktop | on |
| 3 | WebGL on hero cards + fabric stripes (About/Footer) | on for medium/high tiers |
| 4 | Velocity skew and section edge wipes (2.3) | on (desktop only) |
| 5 | Intro loader | on, first visit only |
| 6 | Custom cursor | on (desktop) |
| 7 | Contact: drawer form vs mailto only | drawer with mailto fallback |
| 8 | Hat stickers on Experience hover | on |
| 9 | Project overlay (4.4) vs links to external case studies | overlay |
| 10 | Archive page for "More from the portfolio" | link to old site until built |

Cut list if time runs short, in this order: draggable signs, needle easter egg, hat stickers, GL cursor trail, stage mode, section edge wipes.
