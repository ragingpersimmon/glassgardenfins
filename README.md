# littlefinswim

Static GitHub Pages site for https://littlefinswim.net, with static validation and deterministic and chaos-style browser backtests.

## Local validation

```bash
npm install
npm test
```

The ten aquarium-question articles are generated from the editorial source in
`tools/build-question-series.mjs`. After changing that series, run
`npm run build:questions` and commit both the source and generated pages.

## Test suites

- `npm run validate:site`: static checks for canonical, Open Graph, and Twitter URL consistency, navigation integrity, `aria-current`, required scripts and landmarks, and baseline CSP directives.
- `npm run test:mutations`: verifies fault detection under deterministic and seeded randomized mutations.
- `npm run test:deterministic`: browser checks for page metadata, canonical URLs, navigation, reduced-motion/runtime fallbacks, comparable question-entry lengths, and at least two contextual product links per question.
- `npm run test:chaos`: seeded (`1337`) browser backtests across random routes, viewports, reduced-motion modes, and resource fault injection (font blocking, script delay/block).
- `npm run build:site`: regenerates the question series, social metadata and JSON-LD, normalized footers, and `sitemap.xml`.

## CI

GitHub Actions runs all validation and test suites on each push and pull request.

## Amazon Associates links

Product links remain ordinary Amazon links until a valid Associates tracking ID is configured. The shared script adds the tag only to allowlisted Amazon hosts.

Use `npm run set:amazon-tag -- your-tag-20` to set a real tracking ID across
the site, or `npm run set:amazon-tag -- --clear` to disable it. The command
validates the ID, updates `site-config.json`, regenerates every product page,
and keeps `/privacy/` synchronized with the actual commission state.

The site currently has no ad network configured, so `ads.txt` is intentionally
absent. Add it only when a network supplies a real publisher record.

## Static-host security boundary

The CSP is delivered through page metadata and contains only directives browsers
enforce from a `<meta>` element. GitHub Pages cannot set custom response headers
for this deployment. Strong framing, HSTS, and reporting headers require a proxy
such as Cloudflare in front of the GitHub Pages origin.

## Scheduled journal entries

Future entries live under `_scheduled/`, which Jekyll excludes from the published site. The scheduled-entry workflow releases the September 15, 2026 stocking update at 07:00 UTC (midnight Pacific), updates the journal index, homepage teaser, and Tank stocking list, runs the complete test suite, commits the published files, and deploys GitHub Pages.
