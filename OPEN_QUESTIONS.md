# OPEN_QUESTIONS.md

Resolve these with Lois before launch. OpenCode appends new entries here as it works. Format: section, what is missing or inconsistent, temporary placeholder used.

## Content and copy
1. **Services: Marketing & campaign design and Digital & content design.** The Figma file only contains the Brand identity content. Need title, description, "what's included" list, "a good fit for" list, timeline and scope for the other two. Placeholder: scraped from the old site if present, otherwise `TODO(copy)`.
2. **Testimonials.** Both cards in Figma contain Lois's own "sewing / K-pop" line attributed to "Alyssa, @femfounderstudio". Need real quotes, names, handles, optional avatars. Placeholder: Figma text, marked TODO.
3. **Testimonials label.** Figma says "A little about me". Using "Kind words" unless Lois prefers another label.
4. **Project tags.** Heure Dorée shows "In Development" and "Podcast & media", which look copied from Africa Built. Confirm the correct tags.
5. **Krate vs Rika Trips.** Experience says "Krate" (drinks wholesalers and depot platform); Selected work calls the same kind of project "Rika Trips". Confirm naming.
6. **Social links.** The footer has three identical mail icons. Need the real list (LinkedIn, Instagram, Behance, email, etc.) and URLs.
7. **About images.** Two tilted image cards are placeholders in Figma. Need photos (portrait, studio, work-in-progress?). Phase 1 note: the old-site portrait (`59e9e35ff0af.jpg`, already optimized in `public/images/projects/portrait-*`) is a confirmed real asset usable as one of the two; the Figma canvas shows the soft placeholder art in both cards.
8. **Project case studies.** Do project cards link to external case studies, open an in-page overlay, or both? Need links or content per project.
9. **"More from the portfolio" destination.** Archive page, old site, or Behance?
10. **Contact.** Email address for mailto fallback and a form endpoint (Formspree or similar) if a form drawer is wanted.
11. **Hero deck images.** Which four projects lead the hero deck (default: Garri & Granola, Heure Dorée, Rika Trips, Africa Built)?

## Design
12. **Project title fonts.** Titles use Blauer Nue 700, Blauer Nue 600 and Outfit 400 across cards. Built as in Figma. Confirm this is intentional.
13. **Services tab mismatch.** Figma shows the Marketing tab active with the Brand identity panel. Built so the panel always follows the active tab.
14. **Header "Let's Talk!" button.** Exists in Figma but is off-canvas. Used only in the mobile menu. Confirm.
15. **Pill arrows.** Only "Contact" shows an arrow in the design. Others gain an arrow on hover (motion). Confirm.
16. **Mobile design.** Figma has desktop only. Mobile layout is derived (DESIGN_SPEC section 12). Review before launch.
17. **Blauer Nue license and files.** Need the licensed web font files (woff2) for weights 400, 500, 600, 700, named `BlauerNue-Regular/Medium/SemiBold/Bold.woff2` in `public/fonts/`. Phase 0 note: @font-face rules are wired to those paths, so they load automatically once the files land; until then the ink stack renders in the Outfit fallback, which can shift title metrics. TODO(spec): tune the `size-adjust` fallback against the real files. Lexend (first fallback in the spec stack) is not installed as a package; Outfit serves as the active fallback.

## Product and motion
18. See `MOTION_SPEC.md` section 15 for the ten motion decisions (stage mode, services pin, WebGL, loader, cursor, drawer, etc.).

## Assets
19. **Project cover art for cards C to F.** Rika Trips, Africa Built, Fintech Is Easy and Gourmet Guide have no artwork in the old site, and Behance galleries exist only for A (Garri & Granola) and B (Heure Dorée). Placeholder: the exact Figma `#c9c9c9` solid (1288x712 AVIF/WebP, `public/images/projects/placeholder-1288.*`), which matches the Figma canvas pixel-for-pixel. Need real covers before launch.
20. **Behance galleries found, not shipped.** Source check during Phase 1: Garri & Granola (11 project modules) and Heure Dorée (7 modules) live at `https://www.behance.net/loisamadi3`, and an automated scan is kept at `scripts/behance-scan.mjs`. DESIGN_SPEC 5.5 lineage is the old-site covers, so A and B ship the scraped covers. Decide: should Behance module art replace the shipped covers, feed later motion/WebGL phases, or stay off the site? (It would also fill the social list in entry 6.)
21. **Placeholder art for hero cards, about cards and the testimonial avatar is the Figma-exported soft fill.** The embedded placeholder (Figma imageRef `ece298d0...`) ships as `public/images/placeholders/soft-placeholder-512.{avif,webp}` (256px source upscaled to 512). Matches the Figma render exactly. Replace when real about photos and avatars arrive (entry 7).
22. **About left half background.** DESIGN_SPEC 8.1 prescribes a CSS gradient, but the Figma node is a full-bleed yellow-stripes image (imageRef `4c6a5ff2...`, kept for comparison only at `reference/figma/about-stripes.png`). Built per spec 8.1. Confirm gradient vs image if the two ever visibly differ.
23. **Rika Trips card text and tags.** The Figma card instance carries a longer description ("premium travel company offering accommodation, chauffeur, airport concierge, visa support, activities, and bespoke services") and extra tags ("Website Redesign", "Travel & Tourism", plus a hidden third tag). Built verbatim per DESIGN_SPEC 5.5 (spec wins over instances). Confirm the final copy and tag list with Lois along with entries 4, 5 and 8.

## Phase 2 (Nav) rendering notes
24. **Banner emoji font (`Noto Heart`).** The heart in "Get in touch! 🩵" self-hosts a 1108-byte COLR subset (U+1FA75) of the Google-served Noto Color Emoji v50 chunk 2 (`public/fonts/noto-heart-1fa75.woff2`, `unicode-range: U+1FA75`). Reason: Figma's export rasterizes a light-blue gradient heart, while Chrome's macOS fallback (Apple Color Emoji) renders a bigger glossy gradient glyph and older Noto SVG/CBDT artwork sets differ too. The subset renders close (33 differing px inside the 24x22 heart crop) but is not artwork-identical to the reference raster; swap in the real bitmap variant if it is ever identified.
25. **Banner emoji size.** Figma lays the heart out at 0.875em (ref ink 15x14, advance about 16.3px inside a 16px Roboto Mono line; without the downsize the link measures 137.5px instead of the spec's 135). Built as a 14px span inside the link so box widths match DESIGN_SPEC 3.1 exactly (146 + 8 + 135, p starts x=575.5). Confirm emoji at 0.875em is intended.
26. **Banner text vertical raster.** Chrome centers the 23.2px line box 1px higher than Figma's export (ref banner ink rows 20 to 34 vs Chrome's 20 to 35 pre-shift). Fixed by positioning the banner paragraph 1px down (`position: relative; top: 1px`); no spec field exists for text y inside the 55px banner, so the reference raster is the arbiter.
27. **Nav gate floor.** `reference/01-navigation.png` stores its 1440th row partially covered (alpha 32) while Playwright screenshots are opaque, so the last row (1440 px, 0.585%) always diffs. The 1.0% budget is 2462 px; after that floor, remaining raster deltas (banner glyph weight, pill border AA, logo vector AA, emoji artwork) leave roughly 100 px of margin. Nav passes at 0.97% (2385 px). If nav needs bigger cuts later, the reference alpha and text-weight rasterization are the two causes to revisit.

