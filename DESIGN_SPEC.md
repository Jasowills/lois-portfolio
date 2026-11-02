# DESIGN_SPEC.md: Lois Amadi Portfolio ("the lois.og")

Source of truth for every pixel. Extracted directly from the Figma file `KnUSayWOjaZpVjMqNRCmja`, frame `546:3153` ("Homepage redesign v2"), then cross-checked against the PNG exports in `/reference`.

**Rules for the builder (OpenCode):**
1. Do not guess or "improve" any value in this file. If a value is missing, write `TODO(spec)` and list it in `OPEN_QUESTIONS.md`. Do not invent.
2. Design width is **1440px**. Every number below is in px at 1440 unless stated. Section-local coordinates have their origin at the section's top-left corner.
3. Sizes in "true size" are the unrotated size of the element. Figma reports bounding boxes of rotated nodes, so those were converted back to true sizes.
4. Where the Figma file has a flaw (copy errors, mismatched states), it is listed under **Known inconsistencies** in each section. Build what the spec says in "Build as", not the flaw.
5. Letter-spacing values are given in px as exported by Figma (convert to `em` in code: `px / fontSize`).
6. Everything marked **derived** (responsive, hover, motion) is not in the Figma file. Those decisions live in `MOTION_SPEC.md` or this file's responsive section.

---

## 0. Page structure and vertical offsets (desktop, 1440)

| # | Section | Height | Page Y start | Background |
|---|---------|--------|--------------|-----------|
| 1 | Navigation (banner + header) | 170.1 | 0 | banner `#1a160c`, header `#fffef9` |
| 2 | Hero | 865.9 | 170.1 | `#fffce6` |
| 3 | Selected work | 2571.9 | 1036 | lavender plaid on `#e4d9fe` |
| 4 | Experience | 780 | 3607.9 | `#ded1ff` |
| 5 | Services | 1225.9 | 4387.9 | `#fffef9` |
| 6 | About | 968.2 | 5613.8 | left yellow stripes, right `#fffefe` |
| 7 | Testimonials | 819.4 | 6582 | `#fffefe` |
| 8 | CTA | 828.3 | 7401.4 | `#deeab3` |
| 9 | Footer | 716 | 8229.7 | dark stripes `#1a160c` / `#1c1b17` |

Total about 8946px at 1440 wide. Section borders: where Figma shows a 1px `#000000` stroke on a full-width section frame (Selected work, Testimonials, CTA), render a 1px black **top and bottom** border. The header has a 1px `#2b2b2b` bottom border.

---

## 1. Design tokens

### 1.1 Colors (exact hex from Figma)

```
/* ink and text */
--ink:            #000000;   /* outlines, nav text, hero heading */
--ink-warm:       #1a160c;   /* banner bg, button labels, logo text, footer bg base */
--heading:        #040100;   /* section headings */
--body:           #202020;   /* long copy, services/about/testimonial text */
--card-text:      #282727;   /* project descriptions */
--tag-text:       #101010;
--sub:            #101010;   /* section subtitle */
--muted:          #5e5e5e;   /* project year */
--svc-title:      #0d0d0d;
--dark-2:         #2b2b2b;   /* header bottom border */
--divider:        #dadada;

/* surfaces */
--cream:          #fffef9;   /* header, services bg, inner service card, CTA blob, banner text */
--cream-hero:     #fffce6;   /* hero bg */
--cream-white:    #fffefe;   /* about right panel, testimonials bg */
--card:           #fbfaf4;   /* project cards */
--exp-card-1:     #fffcf5;   /* Krate card */
--placeholder:    #c9c9c9;   /* project image placeholder only */

/* accents */
--yellow:         #fef5b6;   /* logo fill, labels, CTA buttons, social square, sign */
--yellow-deep:    #fbf1a8;   /* about stripe alt */
--pink:           #fbc4df;   /* nav pill "Work" */
--pink-soft:      #fbd4e6;   /* social square, "Services" sign */
--pink-tab:       #fddfe7;   /* services tab + panel (Brand identity) */
--pink-exp:       #fce8ed;   /* Africa Built card */
--tag-pink:       #f5e8ec;   /* project tag pill */
--blue:           #deedfa;   /* nav pill "Services", services tab 3, testimonial cards */
--blue-exp:       #e0ebff;   /* Fintech card */
--sky:            #cff5ff;   /* "Work" sign */
--green-pill:     #bad892;   /* nav pill "About" */
--lime:           #bed35a;   /* sticker labels, social square */
--lime-tab:       #f1fdd8;   /* services tab 2 (Marketing) */
--lime-exp:       #e5f0bf;   /* Marklite card */
--cta-bg:         #deeab3;
--lav:            #dbbcff;   /* nav pill "Contact", "About" sign, social square */
--lav-label:      #d3c4f7;   /* "A few ways I can help" sticker */
--lav-work:       #e4d9fe;   /* selected-work bg base */
--lav-exp:        #ded1ff;   /* experience bg */
--orange:         #ff8c42;   /* "More from the portfolio" button, "Back to Top" sign */
--orange-hero:    #fd9e60;   /* hero button */
--orange-cta:     #ff9c39;   /* about button, hidden "View Project" button */
--purple:         #781ea7;   /* "Let's Talk!" button (exists in Figma but off-canvas/hidden) */

/* experience section text */
--exp-heading:    #1f1a1a;
--exp-label:      #29241f;
--exp-role:       #45384d;
--exp-body:       #2e292e;
--exp-stroke:     rgba(31,26,26,0.25);

/* footer text */
--footer-text:    #fffef3;
--footer-sub:     #cccccc;
```

### 1.2 Typography

| Role | Family | Weight | Size / line-height | Letter-spacing (px) |
|------|--------|--------|--------------------|---------------------|
| Banner | Roboto Mono | 400 (bold = 700 for "Get in touch!") | 16 / 23.2 | -1.12 |
| Nav pill | Outfit | 400 (Services pill = 500) | 16 / 23.2 | -0.32 |
| Hero H1 | Blauer Nue | 600 | 60 / 72 | -2.4 |
| Hero paragraph | Outfit | 400 | 26 / 36 | -0.52 |
| Button label | Outfit | 400 | 18 / 26.1 | -0.36 |
| Section H2 (work, about, testimonials) | Blauer Nue | 600 | 45 / 50 | -1.35 |
| Section H2 (services, CTA) | **Outfit** | 400 | 45 / 50 | -1.35 |
| Work subtitle | Outfit | 400 | 24 / 30.24 | -0.24 |
| Sticker label | Outfit | 400 | 16 / 20.16 | -0.16 |
| Project title | per card (see 4.4) | 400/600/700 | 32 / 38.4 | -0.96 |
| Project year | Blauer Nue | 400 | 16 / 19.2 | -0.48 |
| Project description | Outfit | 400 | 22 / 32 | -0.22 |
| Tag | Outfit | 400 | 16 / 20 | +0.16 |
| Experience label | Outfit | 400, uppercase | 14 / 17.64 | 0 |
| Experience H2 | **Fraunces** | 400 | 42 / 51.786 | 0 |
| Experience intro | Outfit | 400 | 18 / 22.68 | 0 |
| Experience card title | Fraunces | 400 | 24 / 29.592 | 0 |
| Experience role | Outfit | 400 | 14 / 17.64 | 0 |
| Experience desc | Outfit | 400 | 15 / 18.9 | 0 |
| Experience footnote | Outfit | 400 | 16 / 20.16 | 0 |
| Service tab | Outfit | 400 | 32 / 40.3 | -0.96 |
| Service card title | Outfit | 500 | 28 / 35.3 | -0.84 |
| Service body, lists, meta | Outfit | 400 | 22 / 32 | -0.44 |
| About bio | Outfit | 400 | 24 / 32 | -0.48 |
| Testimonial quote | Outfit | 400 | 24 / 32 | -0.48 |
| Testimonial name | Outfit | 500 | 28 / 44.6 | -0.54 |
| CTA paragraph | Outfit | 400 | 26 / 36 | -0.52 |
| Footer copyright | Outfit | 400 | 28 / 35.3 | -0.56 |
| Footer credit | Outfit | 400 | 22 / 27.7 | -0.44 |
| Sign label (Back to Top, Services, Get in Touch) | Blauer Nue | 500 | 24 / 28.8 | -0.48 |
| Sign label (About, Work) | Outfit | 400 | 24 / 30.2 | -0.48 |

**Font sourcing:**
- Outfit, Fraunces, Roboto Mono: Google Fonts, self-host via `@fontsource-variable/*` (preload Outfit 400/500/600 and Blauer Nue 600).
- **Blauer Nue is a commercial font.** Expect the files in `/public/fonts/BlauerNue-{Regular,Medium,SemiBold,Bold}.woff2`. If missing, use fallback stack `'Blauer Nue','Lexend','Outfit',system-ui,sans-serif` and log a warning in `OPEN_QUESTIONS.md`. Use `font-display: swap` plus `size-adjust` on the fallback to limit layout shift.
- Enable `font-feature-settings: normal`. No synthesized bold.

### 1.3 Shape, stroke, shadow

- Outline everything: **1px solid #000** on pills, buttons, cards, image frames, tabs, panels. Exceptions: tag pills (no stroke), experience cards (1px `rgba(31,26,26,.25)`), social squares (no stroke), sticker labels (0.5px `#e9e9e9`).
- Radii: buttons/pills `40` (nav pills `24`), project and about cards and hero cards `36`, service inner card `36`, testimonial avatar `24`, experience cards `18`, tags `32`, sticker labels `4`, signs `8`, social squares `5.69`, service tabs top corners `36` and panel bottom corners `36`.
- Logo shadow: hard black offset (built into the SVG, no CSS shadow).
- Signpost base shadow: drop shadow `0 2px 6px rgba(84,84,84,0.44)`.

### 1.4 Buttons (all identical structure)

Pill, padding `16px 28px`, `border:1px solid #000`, radius `40`, inner gap `8`, optional trailing arrow icon 24x24 with `gap:4`. Label Outfit 400 18/26.1 ls -0.36 `#1a160c`. Height 58.

| Button | Fill | Width | Where |
|--------|------|-------|-------|
| See what I do | `#fd9e60` | 186 | hero |
| More from the portfolio | `#ff8c42` | 265 | work |
| See what I do (services) | `#fef5b6` | 186 | services panel |
| A little more about me | `#ff9c39` | 252 | about |
| Tell me what you're working on | `#fef5b6` | 317 | CTA |
| View Project (hidden state, shown on card hover) | `#ff9c39`, label 600 weight | 187 | project card |

Trailing icon: arrow-up-right, 24x24 box, glyph 14.7x14.7, stroke black, 2px. Nav "Contact" pill uses arrow-right (glyph 20x10).

---

## 2. Assets

| Asset | How to obtain |
|-------|---------------|
| Logo (nav, yellow fill `#fef5b6`, 140.3x75.1) | `scripts/figma-export.mjs` exports node `I546:3156;311:1825` as `assets/logo-nav.svg`. Colors inside: `#1A160C`, `#231F20`, `#FEF5B6`. |
| Logo (footer, white cloud, 506.9x271.2) | Node `546:3345`. Same artwork scaled up, cloud fill white. Build as one component with a `fill` prop. |
| Signpost (236x586) | Node `546:3418` exported as `assets/signpost.svg` (pole, ball, base). Signs are HTML (see 9.5). Colors: `#FBFAF4`, `#959491`, `#767676`, `#DCDCDC`. |
| CTA blob | Inline SVG below (1315x671). |
| Project images | `scripts/scrape-projects.mjs` downloads them from trulylois.work. |
| Icons | verified (check in circle, 24x24, glyph 20x20), arrow-right, arrow-up-right, LinkedIn "in", mail envelope. Draw as inline SVG, 2px stroke black. |

CTA blob SVG (verbatim from Figma, fill `#fffef9`, stroke black 2):

```svg
<svg width="1315" height="671" viewBox="0 0 1315 671" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M414.09 48.0271C313.214 23.102 178.28 -9.96998 73.1197 46.0829C24.604 71.9411 -7.52552 118.502 3.00608 163.208C10.722 195.936 39.0342 223.52 52.4965 255.127C101.919 371.204 -66.336 518.582 48.7129 618.037C167.457 720.688 376.695 600.425 525.809 621.274C591.077 630.401 648.635 662.415 714.478 668.623C844.681 680.892 960.007 590.558 1091.13 593.279C1147.9 594.462 1238.09 621.253 1288.82 580.592C1357.1 525.858 1266.71 439.293 1249.99 388.061C1213.93 277.607 1360.91 138.043 1253.31 43.581C1104.61 -86.9554 754.919 132.252 414.09 48.0271Z" fill="#FFFEF9" stroke="#000" stroke-width="2"/>
</svg>
```

Note the path overflows its viewBox slightly (negative coordinates). Use `overflow: visible`.

---

## 3. Navigation (1440 x 170.1)

**Reference:** `reference/01-navigation.png`

### 3.1 Announcement banner
- Full width, height 55, bg `#1a160c`, padding 16, content centered.
- Text, single line, centered: `Available to work ` (Roboto Mono 400 16/23.2 ls -1.12, color `#fffef9`) followed by `Get in touch! 🩵` (Roboto Mono 700, same size). Gap between the two spans: 8. Total text block starts x=575.5, 146 + 8 + 135 wide.
- "Get in touch!" is a link to `#contact`.

### 3.2 Header
- y 55 to 170.1, height 115.1, bg `#fffef9`, bottom border 1px `#2b2b2b`.
- Horizontal padding 84. Inner content width 1272, vertical padding 20 top and bottom. Three columns with gap 96: left group, logo, right group. Everything vertically centered.
- Left group (right-aligned to the logo, width 469.8): pill **Services**, gap 28, pill **Work**.
- Right group (left-aligned from the logo, width 469.8): pill **About**, gap 28, pill **Contact**.
- Logo centered: x 649.8 to 790.1, y 75 to 150.1 (page coordinates), 140.3 x 75.1. It overlaps the header's vertical padding; logo is taller than the pills (47).

Pill spec (height 47):

| Pill | x | width | fill | text weight | arrow |
|------|---|-------|------|-------------|-------|
| Services | 350.8 | 97 | `#deedfa` | 500 | no |
| Work | 475.8 | 78 | `#fbc4df` | 400 | no |
| About | 886.2 | 83 | `#bad892` | 400 | no |
| Contact | 997.2 | 124 | `#dbbcff` | 400 | yes (arrow-right, 24x24, gap 4) |

Each: padding `12px 20px`, `border:1px solid #000`, radius 24, text `#000`. Pill text widths: Services 57, Work 38, About 43, Contact 56.

**Not rendered (exists in Figma, off-canvas):** a purple `#781ea7` "Let's Talk!" button (128x58, Outfit 600 18, white). Do not render on desktop. Reserve for the mobile menu CTA.

### 3.3 Known inconsistencies
- The Figma pills carry arrow icon layers on all four, but only Contact shows one in the PNG. Build as the table says.
- The "Services" pill is weight 500 and others 400. Keep it (acts as the emphasized item).

---

## 4. Hero (1440 x 865.9)

**Reference:** `reference/02-hero.png`. bg `#fffce6`.

### 4.1 Layout
Hero is padded `84px 40px 64px 72px` (top right bottom left), so the content column is **1328 wide, starting at x=72**, centered at x=736 (16px right of the viewport center). Reproduce this offset. Vertical stack, center aligned, gap 52 between the top block and the button.

Top block (gap 40):
1. **H1**, box 951x144 at x=260.5, y=84. Text: `Good work deserves` / `a better-looking introduction.` (explicit line break after "deserves"). Blauer Nue 600 60/72 ls -2.4, centered, color `#000`.
2. **Card carousel**, container 1328x293.9 at x=72, y=268 (below H1 with 40 gap).
3. **Paragraph**, 924x90 at x=274, y=601.9. Text: `I'm Lois, a brand and visual designer turning good ideas into thoughtful identities, useful visuals and brands people remember. Strategy brain, design eyes. Very serious about the details.` Outfit 400 26/36 ls -0.52 `#000`, centered (wraps to 3 lines).
4. **Button** "See what I do ↗" `#fd9e60`, 186x58 at x=643, y=743.9 (centered at 736).

### 4.2 Card deck (the signature element)
Four image cards, each **true size 391 x 250**, radius 36, `border:1px solid #000`, `overflow:hidden`, image `object-fit:cover`. Centers are all on y=414.9 (page y within hero), so they sit on one horizontal line, tilted alternately.

| Card | Rotation | Center X (hero coords) | Left within container (x-72-195.5) | Z-index |
|------|----------|------------------------|-------------------------------------|---------|
| 1 | -5.54deg | 278.65 | 11.2 | 1 |
| 2 | +6.69deg | 581.05 | 313.6 | 2 |
| 3 | -3.56deg | 879.7 | 612.2 | 3 |
| 4 | +4.96deg | 1175.15 | 907.7 | 4 |

Container-relative top of each unrotated card: `21.9`. Implement as `position:relative; height:293.9px` with absolutely positioned cards, `transform: rotate(...)`, `transform-origin:center`. Stacking order rises left to right (card 2 over 1, card 3 over 2, card 4 over 3). Overlap between neighbors is about 90px.

Images for the 4 cards: the four lead projects scraped from the old site (see scrape script; default order: Garri & Granola, Heure Dorée, Rika Trips, Africa Built).

---

## 5. Selected work (1440 x 2571.9)

**Reference:** `reference/03-selected-work.png`. bg: plaid, see 5.1. 1px black borders top and bottom. Padding `76px 64px 64px`. Content column 1312 wide (x=64 to 1376). Vertical gap 32 between label and the rest.

### 5.1 Background pattern
Base `#e4d9fe` with a very subtle plaid (measured from the PNG): vertical bands about 90px of `#e4d9fe` alternating with about 75px of `#e5dbfe` (period about 165px); horizontal bands about 96px of `#e3d7fe` alternating with about 78px of `#e4d9fe` (period about 174px). Build with two layered `repeating-linear-gradient`s at roughly 3 to 4% contrast. It must read as a barely visible grid, not stripes.

### 5.2 Header block
- **Sticker label** "Selected work": true size 122x36, centered at x=720 (page x 658 to 782), y=76, rotated **+2.81deg**, fill `#fef5b6`, border `0.5px solid #e9e9e9`, radius 4, padding `8px 12px`, text Outfit 400 16/20.16 ls -0.16.
- **H2** "A little bit of everything. Very much on purpose." Blauer Nue 600 45/50 ls -1.35 `#040100`, centered, box 1055x50 at x=192.5, y=149.9. Single line.
- **Subtitle** "A selection of brand worlds, campaigns and digital work I've helped bring to life. Different briefs, different hats, same love for a good idea." Outfit 400 24/30.24 ls -0.24 `#101010`, centered, box 1003x60 at x=218.5, y=227.9 (two lines).
- Gap between header block and the grid: 60 (grid starts y=347.9).

### 5.3 Grid
2 columns of **644px**, column gap **24**, row gap **24**. Cards are **top-aligned** within a row (they are different heights; the row is as tall as the tallest). Total grid height 2042, starts y=347.9.

Row layout (y relative to section top):
- Row 1 y=347.9: card A 644x674, card B 644x642
- Row 2 y=1045.9: card C 644x674, card D 644x676
- Row 3 y=1745.9: card E 644x644, card F 644x642

After the grid: gap 60, then **More from the portfolio ↗** button (265x58, `#ff8c42`) centered at x=720, y=2449.9. Section bottom padding 64.

### 5.4 Project card anatomy (644 wide)
`background:#fbfaf4; border:1px solid #000; radius:36; overflow:hidden`. Vertical stack, gap 48 between image and body.

1. **Image**: 644x356, radius 36, 1px black stroke, `object-fit:cover`. (Placeholder fill `#c9c9c9` until real images land.)
2. **Body** padding `0 40px 40px 40px`, content width 564, internal gap 24:
   - Title row (38 tall): title left (width 502), year right-aligned at x offset 526 from body left (38 wide, vertically centered, 9.5px lower than the title top).
   - Description (Outfit 22/32 ls -0.22 `#282727`), 2 or 3 lines depending on copy.
   - Tags row, gap 16, wrap not needed at 564 for these data: each tag is a pill `#f5e8ec`, radius 32, padding 12, gap 6, height 48, containing a 24x24 "verified" check-circle icon (glyph 20x20, black) and the label (Outfit 400 16/20 ls +0.16 `#101010`).
3. **Hidden hover button**: "View Project ↗" `#ff9c39`, 187x58, label weight 600, sits at the bottom of the body (y offset 670 in the card frame). It is **hidden at rest**. Reveal on hover or focus (see motion spec). The card must not change height when it appears (overlay or reserved space within existing bottom padding is not possible at 40px, so position it absolutely at the bottom-left of the image or bottom of the body; see MOTION_SPEC 4.3).

Title/year coordinates inside body: title at (0,0) 502x38, year at (526, 9.5) 38x19.

### 5.5 Card data (verbatim)

| # | Title | Title font | Year | Description | Tags | Card height |
|---|-------|-----------|------|-------------|------|-------------|
| A | Garri & Granola | Blauer Nue 700 | 2025 | A homeware concept with a point of view: cultural references, considered objects and a visual world built to feel collected, not decorated. | Brand Identity, Content strategy | 674 |
| B | Heure Dorée | Blauer Nue 600 | 2026 | A sardine brand identity and packaging direction that gives a pantry staple a more distinctive place on the shelf. | Content distribution, In Development, Podcast & media | 642 |
| C | Rika Trips | Blauer Nue 600 | 2025 | Brand and digital marketing for a drinks-depot platform. Strategy, messaging and visual content made for the realities of the business. | E-commerce Website, Fashion & Lifestyle | 674 |
| D | Africa Built | Outfit 400 | 2025 | Podcast content distribution and design, turning conversations with African builders into social content people can discover and share. | Content distribution, Canva Websites, Wedding | 676 |
| E | Fintech Is Easy | Outfit 400 | 2024 | Editorial and social design that helps make fintech ideas easier to follow, save and pass along. | Editorial design, Fintech | 644 |
| F | Gourmet Guide | Blauer Nue 600 | 2024 | A digital product concept exploring how food discovery and community could come together in one experience. | Content design, Editorial & fintech | 642 |

A hidden third tag ("Travel & Tourism") exists on cards A and C in Figma. It is hidden; do not render.

### 5.6 Known inconsistencies
- Title fonts differ per card (700, 600, and Outfit 400). Reproduce as is (treated as per-brand typographic flavor). Confirm with Lois.
- Card B tags "In Development" and "Podcast & media" look copy-pasted from Africa Built. Build verbatim, flag in `OPEN_QUESTIONS.md`.
- Experience section calls the drinks platform "Krate" while card C is titled "Rika Trips". Keep both verbatim, flag.

---

## 6. Experience (1440 x 780)

**Reference:** `reference/04-experience.png`. bg `#ded1ff`. Padding `84px 120px`. Content column 1200 wide at x=120. Vertical gap 28. All text left aligned.

| Element | y | Spec |
|---------|---|------|
| Label `THE WORK BEHIND THE WORK` | 84 | Outfit 400 14/17.64, uppercase (type it in caps), `#29241f`, 1200x18 |
| H2 `I've worn a few creative hats.` | 130 | Fraunces 400 42/51.786 `#1f1a1a`, 1200x52 |
| Intro `From shaping a brand's voice to getting the right content in front of people, here's some of the work I've done with teams and clients.` | 210 | Outfit 400 18/22.68 `#2e292e`, 1100x23 (single line) |
| Card row | 261 | container 1200x370, `overflow:hidden`, gap 18 |
| Footnote `The hat changes with the brief. The care stays the same.` | 659 | Outfit 400 16/20.16 `#2e292e` |

**Cards:** 4 cards, each **282 x 330**, radius 18, `border:1px solid rgba(31,26,26,.25)`, padding `24px 22px`, inner width 238, vertical gap 12, `overflow:hidden`. x positions 120, 420, 720, 1020 (gap 18).

| Card | Fill | Title | Role | Description |
|------|------|-------|------|-------------|
| 1 | `#fffcf5` | Krate | Brand & Digital Marketing | Brand direction, content planning, campaign concepts and social design for a platform built for drinks wholesalers and depot owners. |
| 2 | `#fce8ed` | Africa Built | Content Distribution & Design | Repurposing podcast conversations into social-first content, including clips and carousel design. |
| 3 | `#e0ebff` | Fintech Is Easy | Content Design & Distribution | Packaging fintech ideas for social channels through clear, useful visual storytelling. |
| 4 | `#e5f0bf` | Marklite | Visual Experience Design | Visual design, motion graphics and digital experience work across software and marketing. |

Title: Fraunces 400 24/29.59 `#1f1a1a`. Role: Outfit 400 14/17.64 `#45384d`. Description: Outfit 400 15/18.9 `#2e292e`. Cards are tall and mostly empty at the bottom by design (breathing room for the hover motion).

---

## 7. Services (1440 x 1225.9)

**Reference:** `reference/05-services.png`. bg `#fffef9`. Padding `76px 64px 64px`. Content 1312 at x=64.

- **Sticker label** "A few ways I can help": true size 171x36, center x=720, y=76, rotated **-2.00deg**, fill `#d3c4f7`, same label style as 5.2.
- **H2** "The right kind of creative help, for what you need." **Outfit** 400 45/50 ls -1.35 `#040100`, centered, box 674x100 at x=383, y=149.9 (two lines: "...creative help, for" / "what you need.").
- Gap 60 then the folder component at y=309.9 (1312 x 852).

### 7.1 Tabs (folder tabs)
Three tabs in a row, **no gap**, each **437.33 wide**, x = 64, 501.3, 938.7. Top corners radius 36, bottom corners 0, `border:1px solid #000`, padding 32, text Outfit 400 32/40.3 ls -0.96 `#0d0d0d`, left aligned.

| Tab | Fill | Label |
|-----|------|-------|
| 1 | `#fddfe7` | Brand identity |
| 2 | `#f1fdd8` | Marketing & campaign design |
| 3 | `#deedfa` | Digital & content design |

- **Active** tab: top y=309.9, height **144** (grows upward 20px), wraps to two lines if needed, merges into the panel (no bottom border, touches panel top at y=453.9).
- **Inactive** tab: top y=329.9, height **104**, bottom edge at y=433.9 (a 20px gap above the panel).

### 7.2 Panel
y=453.9, 1312 x 708, bg = **active tab's fill**, `border:1px solid #000`, radius `0 0 36px 36px`, padding 32, inner gap 45.

**Inner card:** 1248 x 644, bg `#fffef9`, `border:1px solid #000`, radius 36, padding 36, gap 36. Content width 1176.

1. Title (Outfit 500 28/35.3 ls -0.84 `#0d0d0d`), desc (Outfit 400 22/32 ls -0.44 `#202020`), gap 24 between title and desc. Title y=0, desc y=59 (relative to inner content).
2. Divider: 1px `#dadada`, full width, 32 below desc.
3. Two columns, each 576, column gap 24 (x=0 and x=600), column header gap 12 above list:
   - Left header `WHAT'S INCLUDED:` then a bullet list (Outfit 400 22/32 ls -0.44 `#202020`), bullets are small round dots ("•") with about 16px hanging indent.
   - Right header `A GOOD FIT FOR:` then bullet list.
4. Bottom row, gap 40 above: meta lines on the left and the **See what I do ↗** button (186x58 `#fef5b6`) on the right edge (x=990 from content left). Meta lines (Outfit 22/32): `TIMELINE:` (bold label) + ` Timeline agreed together`, then `PROJECT SCOPE:` + ` Scoped to your project`, gap 20 between lines, each line has a 32px tall label chip with an 8px gap.

### 7.3 Content: Brand identity (verbatim, from Figma)
- Title: `Branding & Identity`
- Desc: `For brands that need a clear visual identity, from the first idea to the details people remember.`
- What's included:
  - Strategic 1 hour Clarity Session
  - Creative direction and a focused mood board.
  - Full Logo Suite: Primary, secondary, and submark logos.
  - Color palette, typography suite, and usage guidelines.
  - Brand pattern, graphics, and custom illustration assets.
  - 2-3 pieces of brand collateral (e.g., templates, cards..).
  - Comprehensive Brand Guidelines
  - Two design concept & two rounds of revisions.
- A good fit for:
  - New businesses ready to launch with intention.
  - Growing brands whose visuals no longer fit.
  - Teams that need a consistent identity across touchpoints.

### 7.4 Content: Marketing and Digital tabs
**Not present in the Figma file.** Scrape the live site (`scripts/scrape-projects.mjs` also captures page text) and map the copy into the same data shape. If the site has none, use the structure with `TODO(copy)` text and flag in `OPEN_QUESTIONS.md`. Do not invent offerings.

### 7.5 Known inconsistencies
- In Figma the active tab is Marketing (lime) but the panel is pink with Brand content. Build: **panel color and content always follow the active tab.** Default active tab on load: tab 1 (Brand identity).
- Active-tab height is 144 (sized for the two-line Marketing label). Keep the active tab at 144 regardless of label length, text top-aligned with padding 32, as in Figma.

---

## 8. About (1440 x 968.2)

**Reference:** `reference/06-about.png` (2x export, 2880 wide). Two halves of 720 each.

### 8.1 Left half (720 wide, full height)
- Background: vertical stripes alternating `#fef5b6` and `#fbf1a8`, each band about **47px** wide (measured about 94px at 2x), soft 5 to 6px gradient edges. Right border: 1px `#000`.
- Padding `64px 52px 64px 72px`, gap 41.2.
- **Two tilted image cards** (true size **593 x 397.5**, radius 36, 1px black stroke, `overflow:hidden`):
  - Card 1: rotation **-3.32deg**, bbox top-left at (62, 48.2), center (369.5, 263.8).
  - Card 2: rotation **+1.64deg**, bbox top-left at (67.4, 497.3), center (369.5, 704.5).
- **Cloud sticker badges** (the "the lois.og" mark, small, with hard black shadow), pinned to card corners and counter-rotated against their card:
  - Badge 1: top-right of card 1, bbox (573.7, 29.8), about 101.8 x 50.1 true size, rotation **+3.32deg**, light pink/lavender fill `#f5e8ec`.
  - Badge 2: top-left of card 2, bbox (63.9, 480.9), about 104.3 x 53.5, rotation **-15.12deg**, orange fill `#ff9c39`.
- Images: **TODO(assets)** portrait or work photography; confirm with Lois. Use `#fafafa` checker placeholder until supplied.

### 8.2 Right half (720 wide, bg `#fffefe`)
Padding `76px 72px 64px 52px`, content width 596, x starts at 772. Vertical gap 52 (content block to button).
1. **Sticker label** "About": true size 68x36, rotation **-5.40deg**, fill `#bed35a`, at (772, 76).
2. **H2** "Hi, I'm Lois. I make the thinking visible." Blauer Nue 600 45/50 ls -1.35 `#040100`, left aligned, box 596x100 at y=150.2 (two lines). Gap 32 from label.
3. **Bio** (Outfit 400 24/32 ls -0.48 `#202020`, 596 wide, 512 tall, three paragraphs separated by a blank line, 32px):
   - `I'm Lois Amadi, a brand and visual designer with a soft spot for thoughtful ideas and the details that make them stick. I work across brand identity, campaign and marketing design, and digital content, bringing strategy and visuals into the same room (they get along better than you'd think).`
   - `My experience spans consumer brands, creative projects and tech teams. I've shaped brand and content work, designed for digital channels, and helped turn big piles of information into clear, engaging stories.`
   - `I started in fashion, so I'll always care about the details. When I'm not designing, I'm probably sewing something, watching a K-drama, or mentally redesigning a sign I passed on the way here.`
4. **Button** "A little more about me ↗" `#ff9c39`, 252x58, at y=846.2.

Hidden in Figma (ignore): a dark `#2c2c2c` "Show me how, Hayley" button.

---

## 9. Testimonials (1440 x 819.4)

**Reference:** `reference/07-testimonials.png` (2x). bg `#fffefe`, 1px black borders top and bottom. Padding `76px 72px 64px`. Content 1296 wide at x=72. Left aligned section.

- **Sticker label** left-aligned at x=72, y=76, rotated **+3.96deg**, true size 137x36, fill `#bed35a`, text `A little about me` (**this is a copy error from the Figma file, see 9.3**).
- **H2** "Trusted by amazing people and teams across the globe." Blauer Nue 600 45/50 ls -1.35 `#040100`, left aligned, box 652x100 at (72, 153.4), two lines.
- Gap 60 then two cards at y=313.4: each **618 x 442**, gap 60 (x=72 and x=750), `background:#deedfa` (Figma shows a subtle texture image over it, use flat color), `border:1px solid #000`, radius 36, padding `40px 32px`.
- Card content (width 554, centered text, gap 36): avatar **144 x 129**, radius 24, 1px black stroke, centered (x offset 205 from content left); quote Outfit 400 24/32 ls -0.48 `#202020` (box 554x128, 4 lines); attribution Outfit 500 28/44.6 ls -0.54 `#040100` (`-Alyssa, @femfounderstudio`).

### 9.3 Known inconsistencies (build the "Build as" version)
- The label text `A little about me` is wrong for this section. **Build as:** `Kind words` (placeholder, confirm with Lois).
- Both cards contain the same "sewing something cute, blasting K-pop..." line, which is Lois's About text, not a testimonial. **Build as:** a `testimonials.json` data file with two entries marked `TODO(content)`; render the real quote text only when supplied. Until then use the Figma text so the layout can be verified, but keep the data-driven structure.
- Hidden in Figma: "Starting At / $497 / (One Time)" pricing layers. Ignore.

---

## 10. CTA (1440 x 828.3)

**Reference:** `reference/08-cta.png` (2x). bg `#deeab3`, 1px black borders top/bottom, padding `76px 72px 64px`.

- Blob SVG (section 2) fills the content area: x 64 to 1376, y 86 to 754 (1312 x 668), fill `#fffef9`, stroke 1px black (render at stroke-width 2 in the viewBox units, scales to about 1px).
- Centered content (1312 wide column, text blocks 1055 wide at x=192.5):
  - H2 `Got a project in mind? Let's talk.` **Outfit** 400 45/50 ls -1.35 `#040100`, centered, y=298.1.
  - Paragraph `Tell me what you're building, what's not working yet, or what you need an extra pair of creative hands for. We'll take it from there.` Outfit 400 26/36 ls -0.52 `#040100`, centered, 1055x72 at y=380.1 (2 lines).
  - Button `Tell me what you're working on ↗` `#fef5b6`, 317x58 at x=561.5, y=484.1. Gap about 32 between paragraph and button.
- Block is vertically centered in the blob.

---

## 11. Footer (1440 x 716)

**Reference:** `reference/09-footer.png` (2x).

- Background: vertical stripes `#1a160c` and `#1c1b17`, band width about **69.5px** (measured about 139px at 2x), soft 4 to 6px gradient edges. Padding `76px 72px 64px`.
- Two columns, gap 96: left 1060 wide, right is the signpost (236 wide, x=1132).

### 11.1 Left column (gap 28)
1. **Logo** (footer variant): 506.9 x 271.2 at (72, 76), white cloud `#ffffff` fill with the hard black offset shadow, wordmark dark.
2. **Social row** at y=412.4: four squares, each **59.8 x 52.4**, radius 5.69, padding `11.4px 14.2px`, gap 14.2, x = 72, 146, 220.1, 294.1. Fills: `#dbbcff` (LinkedIn "in" glyph, 31.4x29.6), `#fbd4e6`, `#fef5b6`, `#bed35a` (envelope glyphs, 32.9x26.3). **Known issue:** three identical mail icons. **Build as:** LinkedIn, Email, plus two socials from the old site (scrape; if none, Instagram and Behance placeholders flagged in `OPEN_QUESTIONS.md`). Glyph color black.
3. **Copyright block** at y=530: `© 2026 Lois Amadi. All rights reserved, all wrongs forgiven... eventually. No pixels were harmed in the making of this site.` Outfit 400 28/35.3 ls -0.56 `#fffef3`, 847 wide, two lines. (Note the leading space in the Figma string.) Gap 24 then credit `Designed by me. Tweaked approximately a thousand times.` Outfit 400 22/27.7 ls -0.44 `#cccccc`, at y=624.

### 11.2 Signpost (right column, 236 x 576 at x=1132, y=76)
- **Stand** (126 wide, centered at x=1250): a vertical pole (stroke 17, gradient `#fbfaf4` to `#959491`, from y=79 to y=628), a ball cap 48x48 at the top (radial gradient `#fbfaf4` to `#959491`, y 76 to 124), and an elliptical base 126x25 at y=627 (gradient `#fbfaf4` to `#959491`, drop shadow `0 2px 6px rgba(84,84,84,.44)`). Export as `signpost.svg`.
- **Signs** (HTML links stacked over the pole), each **224 x 61/62**, radius 8, `border:1px solid #000`, padding `16px 20px`, text centered. Vertical gap 16 between the layout boxes (rotated bboxes overlap by design). Centered on the pole at x=1250.

| Sign | Label | Fill | Rotation | Layout y (page) | Font |
|------|-------|------|----------|-----------------|------|
| 1 | Back to Top | `#ff8c42` | 0deg | 160.8 | Blauer Nue 500 24/28.8 |
| 2 | About | `#dbbcff` | -5.17deg | 237.8 | Outfit 400 24 |
| 3 | Work | `#cff5ff` | +5.15deg | 335.7 | Outfit 400 24 |
| 4 | Services | `#fbd4e6` | -3.15deg | 433.6 | Blauer Nue 500 24/28.8 |
| 5 | Get in Touch | `#fef5b6` | +2.05deg | 522.8 | Blauer Nue 500 24/28.8 |

Sign links: Back to Top scrolls to top; About, Work, Services scroll to their sections; Get in Touch scrolls to the CTA.

---

## 12. Responsive (derived, not in Figma)

Figma only defines 1440. Build **fluid scaling**, not just breakpoints.

- Breakpoints: `>=1280` desktop (exact 1440 design), `1024-1279` laptop, `768-1023` tablet, `<768` mobile (design target 390).
- Between 1280 and 1440 scale horizontally with `clamp`; do not let any text overflow. Max content width 1440, centered. Above 1440, center the 1440 column and extend backgrounds full-bleed.
- Horizontal page padding: 84 (nav), 64 (work/services), 72 (hero/about/testimonials/CTA/footer), 120 (experience). On mobile use 20.
- **Nav (mobile):** banner stays, shrinks to 14px text. Header becomes logo left plus a "Menu" pill right that opens a full-screen sheet with the same four pills as large tilted stickers plus the purple "Let's Talk!" button.
- **Hero (mobile):** H1 `clamp(34px, 9.5vw, 60px)`, line-height 1.2, letter-spacing -0.04em. Cards become a horizontally scrollable, snap-aligned deck (card width 78vw, keep the tilts and overlap -12%). Paragraph 18/26. Button full width up to 320.
- **Selected work:** 2 columns collapse to 1 below 900. Card image aspect 644:356. Padding 20 inside, title 26, desc 18/26.
- **Experience:** cards become a horizontal scroll-snap row (card width 78vw) below 900.
- **Services:** tabs become a horizontally scrollable tab strip below 900 (keep folder look, tab min-width 240) and the panel stacks (two columns to one).
- **About:** halves stack: stripes and image cards on top (cards scale to fit with the same tilts), text below.
- **Testimonials:** cards stack (or horizontal snap).
- **CTA:** blob scales to container width, text scales down, button full width.
- **Footer:** logo scales, signpost moves below the copyright, centered, signs keep their tilts.
- Touch targets at least 44px. Focus rings: 3px `#000` with 2px `#fef5b6` offset, never removed.

---

## 13. Accessibility and semantics

- One `<h1>` (hero). Section headings `<h2>`, project titles `<h3>`.
- Nav in `<nav aria-label="Primary">`. Banner link is a real link. Skip link at top.
- Project cards are `<article>` with a link wrapping the title; the whole card is clickable via a stretched pseudo-element.
- Services tabs implement the WAI-ARIA tabs pattern (`role="tablist"`, `tab`, `tabpanel`, arrow-key navigation).
- Decorative sticker labels and badges `aria-hidden`.
- Respect `prefers-reduced-motion` (see MOTION_SPEC section 0).
- Text contrast: all text meets AA against its Figma background except `#cccccc` on dark (passes) and `#5e5e5e` on `#fbfaf4` (passes).
- Alt text for every project image from the project title.

---

## 14. Deliverable checklist for fidelity

- [ ] Each section screenshot at 1440 matches its `/reference` PNG within 1% pixel diff (excluding image content).
- [ ] Fonts load with the correct families and weights; no fallback visible when files are present.
- [ ] All colors come from CSS variables above; no hex literals in components.
- [ ] All rotations, radii and offsets match the tables.
- [ ] Lighthouse: Performance 90+, Accessibility 100, no CLS above 0.05.
