# OPEN_QUESTIONS.md

Resolve these with Lois before launch. OpenCode appends new entries here as it works. Format: section, what is missing or inconsistent, temporary placeholder used.

## Content and copy
1. **Services: Marketing & campaign design and Digital & content design.** The Figma file only contains the Brand identity content. Need title, description, "what's included" list, "a good fit for" list, timeline and scope for the other two. Placeholder: scraped from the old site if present, otherwise `TODO(copy)`.
2. **Testimonials.** Both cards in Figma contain Lois's own "sewing / K-pop" line attributed to "Alyssa, @femfounderstudio". Need real quotes, names, handles, optional avatars. Placeholder: Figma text, marked TODO.
3. **Testimonials label.** Figma says "A little about me". Using "Kind words" unless Lois prefers another label.
4. **Project tags.** Heure Dorée shows "In Development" and "Podcast & media", which look copied from Africa Built. Confirm the correct tags.
5. **Krate vs Rika Trips.** Experience says "Krate" (drinks wholesalers and depot platform); Selected work calls the same kind of project "Rika Trips". Confirm naming.
6. **Social links.** The footer has three identical mail icons. Need the real list (LinkedIn, Instagram, Behance, email, etc.) and URLs.
7. **About images.** Two tilted image cards are placeholders in Figma. Need photos (portrait, studio, work-in-progress?).
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
