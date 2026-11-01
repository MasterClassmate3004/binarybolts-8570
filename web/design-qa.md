# Binary Bolts prototype: design review

final result: passed

Reviewed 2026-11-01 against the selected dark industrial theme. This is a local, content-incomplete prototype; this result does not certify a production launch.

## Evidence and state

- Source visual truth: `../docs/selected-theme.png`, 946 x 1663 pixels.
- Implementation: `http://localhost:4173/`, React/Vite, initial exploded assembly state.
- Matched comparison viewport: 946 x 1048 CSS pixels, devicePixelRatio 1. Implementation screenshot is 946 x 1048 pixels; no density scaling was needed.
- Source hero crop: x=0, y=0, width=946, height=1048. The implementation hero occupies the same frame.
- Full-view comparison: `../docs/qa/theme-comparison-final.jpg` places source and implementation together at equal width. Its 38px label strip is outside both content frames.
- Engineering section comparison: `../docs/qa/purpose-comparison.jpg`, source crop y=1048..1663 and implementation crop y=2958..3598 from `home-full.png`. Natural widths are both 946px; the different section heights are preserved.
- Additional screenshots: `home-desktop.png`, `home-ready-desktop.png`, `home-mobile.png`, `home-ready-mobile.png`, `robots-assembled-desktop.png`, `robots-exploded-desktop.png`, `robots-mobile.png`, and `contact-preview-mobile.png`, all in `../docs/qa/`.
- Desktop review: 1440 x 900. Mobile review: 390 x 844. Both used density 1.

## Findings and fixes

1. **Resolved P1: robot covered the heading at the tall desktop viewport.** The initial implementation enlarged and cropped the supplied broad robot across the left text column. Evidence: `home-theme-before.png` and `theme-comparison-before.jpg`. The responsive camera now widens its field of view and increases distance for narrow desktop canvases. The final matched comparison shows the complete robot beside readable text.
2. **Resolved P2: robot viewer clipped the chassis in its assembled/exploded states.** Reset now starts camera fitting from the saved baseline, camera distance responds to assembly separation, and the base position/target leave space around the model. The two desktop robot screenshots show the entire robot within the canvas.
3. **Resolved P2: canvas could remain blank after resizing from an offscreen scroll section.** Resize now re-evaluates visibility, clears the pending frame identifier, and requests a fresh render after changing the drawing buffer. Fresh mobile navigation and desktop-to-mobile resizing were both observed rendering the model.
4. **Resolved P2: type and engineering-section proportions drifted from the reference.** Condensed hero type now has a taller, narrower silhouette. The engineering section uses a wider image column, smaller gap, and narrower display heading. The final full-view and engineering-section comparisons were inspected after these fixes.

No unresolved P0, P1, or P2 issue was observed in the reviewed prototype states.

## Required fidelity surfaces

- **Fonts and typography:** Barlow Condensed display type and DM Sans body/UI type loaded successfully. Hero weight, condensation, two-line wrapping, and heading hierarchy were compared visually with the source. The generated reference does not specify a font; the implemented font is a close interpretation, not an exact font identification. Labels, navigation, CTA, and form text remain real selectable text.
- **Spacing and layout:** Left-aligned hero copy, outlined CTA, right-side model, bottom stage rail, and light two-column section follow the selected composition. The header is 76px desktop/64px mobile for usable controls. Mobile stacks text and robot and collapses navigation. No horizontal page overflow was observed at 390px or 946px.
- **Colors and tokens:** Graphite #191918, warm paper #f1efea, off-white text, fine gray rules, and orange #f47528 retain the selected palette. The robot uses its supplied CAD colors with lighting/material adjustments.
- **Image quality and assets:** The actual supplied Cannonbolt GLB intentionally replaces the imaginary robot in the theme image. It has different proportions, surface detail, and assembly separation. It remains real rendered geometry and is interactive. The generated macro is visibly labeled as a design study; it is not represented as a team photograph. No fake team portraits, logos, event photos, or sponsor assets were introduced.
- **Copy and content:** Main hero headline, description, CTA, and three assembly stages match the selected concept. Other copy was adapted to avoid unsupported team claims. Season history, outreach stories, people, and sponsor details remain explicit content gaps. The form clearly states that it does not send messages.

The full-size comparison made the header, headline, CTA, and stage labels readable. The separate engineering-section comparison provided a focused view of typography, crop, body copy, and image treatment.

## Interaction review

- Home stage controls move through Chassis, Systems, Ready; the robot settles into its supplied assembly. Replay returns to the initial state.
- Robots supports drag/orbit, assembly separation using the slider, and camera reset. Keyboard subsystem tabs change their panel and selected state.
- All six page routes are present. Mobile navigation opens, closes after route selection, and exposes the same routes.
- Team discipline tabs respond to arrow keys. Outreach filters change the selected filter and corresponding empty-state heading.
- Partner CTA opens Contact with the support interest preselected. Required name/email/message fields were filled with sample data; Preview message showed the local confirmation that nothing was sent.
- Reduced-motion handling is implemented as a static assembled home model. The OS preference itself was not changed during this review.

## Geometry and build evidence

The optimizer preserved the source export and created an 11,825,148-byte browser copy from the 192,373,296-byte source. Unique triangle count reduced from 3,378,399 to 632,722. The decoded optimized model bounds differ from the source by at most 3.56e-9m; this is a bounding-box check, not a proof of every surface's fidelity. Geometry was also inspected visually in the browser. Statistics are recorded in `public/models/manifest.json`.

`npm run build` completes successfully. Three.js is loaded as a separate dynamic chunk; Vite reports the expected >500kB chunk-size warning. No deployment or external form delivery was performed.

## Implementation checklist

- [x] Real model integrated, source preserved, compressed web copy used.
- [x] Matched source/implementation comparisons opened together after fixes.
- [x] Desktop and mobile composition inspected.
- [x] Routes and main local interactions exercised.
- [x] Missing team content and local form behavior stated honestly.
- [ ] Supply verified team content, real media, sponsor material, and contact destination before launch.

## Follow-up polish

P3: a further art pass could refine the supplied CAD materials and the presentation grouping. Mobile network speed and performance on physical low-power devices remain unmeasured. The sequence is illustrative, not a physical assembly instruction.
