# Glass Garden Fins

Static GitHub Pages site for http://glassgardenfins.com, with static validation and deterministic and chaos-style browser backtests.

## Local validation

```bash
npm install
npm test
```

The ten aquarium-question articles are generated from the editorial source in
`tools/build-question-series.mjs`. The species catalog is generated from
`_data/species.json`; assign an optional, unique local video object to a species
only when original footage is available. After changing either source, run
`npm run build:site` and commit both the source and generated pages.
The canonical origin is configured once in `site-config.json`; regenerate the
site after changing it.

## Test suites

- `npm run validate:site`: static checks for canonical, Open Graph, and Twitter URL consistency, navigation integrity, `aria-current`, required scripts and landmarks, and baseline CSP directives.
- `npm run check:integrity`: whole-site checks for broken file references, malformed JSON-LD, unsafe autoplay attributes, leaked local URLs, and unreferenced assets.
- `npm run test:mutations`: verifies fault detection under deterministic and seeded randomized mutations.
- `npm run test:deterministic`: browser checks for page metadata, canonical URLs, navigation, reduced-motion/runtime fallbacks, comparable question-entry lengths, and at least two contextual product links per question.
- `npm run test:chaos`: seeded (`1337`) browser backtests across random routes, viewports, reduced-motion modes, and resource fault injection (font blocking, script delay/block).
- `npm run build:site`: regenerates the question series, social metadata and JSON-LD, normalized footers, and `sitemap.xml`.

## Search indexing

`npm run build:site` also maintains index/follow preview directives, aquarium-topic
metadata, journal `ItemList` data, article/video structured data, contextual guide
links, and image/video sitemap entries. The 404 page remains `noindex, follow`.

After a production deployment, the site owner should add `glassgardenfins.com` to
[Google Search Console](https://search.google.com/search-console/) and
[Bing Webmaster Tools](https://www.bing.com/webmasters/), verify ownership, and
submit `http://glassgardenfins.com/sitemap.xml`. Verification credentials should
not be committed to this repository. Indexing and rankings remain controlled by
the search engines.

## CI

GitHub Actions runs all validation and test suites on each push and pull request.

## Amazon Associates links

Product links remain ordinary Amazon links until a valid Associates tracking ID is configured. The shared script adds the tag only to allowlisted Amazon hosts.

Product cards remain text-only until approved Amazon Creators API access is
configured. Do not copy, locally host, or hotlink images from Amazon product
pages; official catalog images must be delivered through Amazon's approved API.

Use `npm run set:amazon-tag -- your-tag-20` to set a real tracking ID across
the site, or `npm run set:amazon-tag -- --clear` to disable it. The command
validates the ID, updates `site-config.json`, regenerates every product page,
and keeps `/privacy/` synchronized with the actual commission state.

The site currently has no ad network configured, so `ads.txt` is intentionally
absent. A reserved footer slot is present, but add provider code only when a
network supplies approved publisher configuration. Do not commit private ad
network credentials.

## Static-host security boundary

The CSP is delivered through page metadata and contains only directives browsers
enforce from a `<meta>` element. GitHub Pages cannot set custom response headers
for this deployment. Strong framing, HSTS, and reporting headers require a proxy
such as Cloudflare in front of the GitHub Pages origin.
