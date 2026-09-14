# littlefinswim

Static GitHub Pages site for https://littlefinswim.net.

## Local checks

- Deterministic invariants: `node ./tools/validate-site.mjs`
- Chaos tests (deterministic + seeded heuristic): `node ./tools/chaos-test.mjs`
- Run both: `npm test`

## What is validated

- Canonical, Open Graph, and Twitter URL consistency per page
- Navigation integrity and `aria-current` correctness
- Required script include and page landmarks
- Baseline CSP presence and required directives
- Fault-detection behavior under injected deterministic and randomized mutations
