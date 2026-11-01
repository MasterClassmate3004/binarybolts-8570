# Binary Bolts · Team 8570

An interactive, multipage website prototype following the selected dark industrial direction.

## Local preview

Install with npm --prefix web install, then start with npm run dev.
The default Vite URL is http://localhost:5173. The running review preview uses port 4173.

The React app is in web/. Navigation covers Home, Team, Robots, Outreach, Partners, and Contact.

## Robot model

The supplied Final Robot Assembly.glb remains in the repository root, untouched.
Source GLB/glTF exports are ignored by Git because of their size. Keep your own copy of them when moving the project.

The browser uses web/public/models/cannonbolt.glb (11.3 MiB, reduced from the 183.5 MiB source). Regenerate it with npm run model:optimize after replacing the source export.

The optimization script reduces mesh complexity, joins compatible face primitives within each mesh, and compresses geometry. It retains the CAD assembly hierarchy and checks the optimized model's bounds against the source after writing and decoding it.

For rendering, the website batches meshes by material and presentation group to reduce draw calls. The scroll sequence is an illustrative exploded assembly presentation, rather than a physical manufacturing guide.

## Prototype behavior

- Home: scroll to assemble Cannonbolt; select a stage to jump within the sequence.
- Robots: drag to orbit, scroll/pinch to zoom, adjust assembly separation, reset the camera, and browse subsystem notes.
- Team: explore disciplines through tabs.
- Outreach: filter the journal's empty states, ready for real event stories.
- Contact: validate and preview a message locally. Messages are not sent or stored.

## Content to supply

Team-approved biographies, location and history, verified season records, outreach entries, actual photographs, partner logos, and a monitored contact address remain to be added.

The mechanism macro is generated illustrative artwork and is labeled as a design study. The 3D robot is the team's supplied CAD export.

The discarded static draft is preserved in docs/archive/static-draft/.

## Review evidence

The visual review and known prototype limits are recorded in [web/design-qa.md](web/design-qa.md). Source comparisons and desktop/mobile screenshots are in docs/qa/.
