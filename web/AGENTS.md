# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Team 8570 decisions

- The user selected theme 1: dark industrial, with condensed type, graphite surfaces, warm paper sections, and orange accents. The source visual is `../docs/selected-theme.png`.
- Build a multipage site with a scroll-driven robot assembly on Home. The supplied Cannonbolt CAD replaces the illustrative robot in the theme image.
- Preserve the original root GLB/glTF exports. Serve the optimized model from `public/models/cannonbolt.glb`; regenerate it with the model optimization script.
- Team facts, competition records, outreach events, sponsors, people, and photographs require real team material. Keep missing content explicit and never invent achievements or metrics.
- The contact form is a local preview until a real destination is supplied. Do not imply a message has been sent.
