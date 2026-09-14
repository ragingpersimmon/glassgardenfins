# littlefinswim

Static GitHub Pages site for https://littlefinswim.net, with static validation and deterministic and chaos-style browser backtests.

## Local validation

```bash
npm install
npm test
```

## Test suites

- `npm run validate:site`: static checks for canonical, Open Graph, and Twitter URL consistency, navigation integrity, `aria-current`, required scripts and landmarks, and baseline CSP directives.
- `npm run test:mutations`: verifies fault detection under deterministic and seeded randomized mutations.
- `npm run test:deterministic`: browser checks for page metadata, canonical URLs, navigation, and reduced-motion/runtime fallbacks.
- `npm run test:chaos`: seeded (`1337`) browser backtests across random routes, viewports, reduced-motion modes, and resource fault injection (font blocking, script delay/block).

## CI

GitHub Actions runs all validation and test suites on each push and pull request.

## Amazon Associates links

Journal product links remain ordinary Amazon links until a valid Associates tracking ID is configured. To enable tracked links and the on-page affiliate disclosure, set the `content` value of the `amazon-associate-tag` meta element on each full entry page, such as `journal/10-aquarium-questions/index.html`. The shared script adds the tag only to allowlisted Amazon hosts.

## Scheduled journal entries

Future entries live under `_scheduled/`, which Jekyll excludes from the published site. The scheduled-entry workflow releases the September 15, 2026 stocking update at 07:00 UTC (midnight Pacific), updates the journal index and homepage teaser, runs the complete test suite, commits the published files, and deploys GitHub Pages.
