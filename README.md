# Glass Garden Fins

Source for [glassgardenfins.com](https://glassgardenfins.com/), a static
planted-aquarium journal published with GitHub Pages. Build tools generate the
question series, species catalog, gallery, metadata, feed, and sitemap; CI
validates every change, builds a public-only artifact, and deploys it.

## Local development

Requires Node.js 22 or newer (CI uses Node.js 24).

```bash
npm ci
npm test
```

`npm test` installs Playwright's Chromium and then runs every suite.

The ten aquarium-question articles are generated from the editorial source in
`tools/build-question-series.mjs`. The species catalog is generated from
`_data/species.json`; assign an optional, unique local video object to a species
only when original footage is available. After changing any source, run
`npm run build:site` and commit both the source and the generated files. CI
rebuilds the site and fails if any generated file differs from the commit.
The canonical origin is configured once in `site-config.json`; regenerate the
site after changing it.

### Content dates

`_data/content-dates.json` stores a fingerprint of each page's visible text and
the date that text last changed. `npm run build:site` re-dates a page only when
its visible content changes, so sitemap `lastmod`, feed `updated`, and JSON-LD
`dateModified` reflect real edits rather than template or footer changes. After
changing the fingerprint rules in `tools/content-dates.mjs`, rebuild the record
from git history with `npm run seed:content-dates`.

## Test suites

- `npm run validate:site`: static checks for canonical, Open Graph, and Twitter URL consistency, navigation integrity, `aria-current`, required scripts and landmarks, baseline CSP directives, content dates and sitemap `lastmod`, the Atom feed, newsletter configuration, and the IndexNow key file.
- `npm run check:integrity`: whole-site checks for broken file references, malformed JSON-LD, unsafe autoplay attributes, leaked local URLs, and unreferenced assets.
- `npm run test:mutations`: verifies fault detection under deterministic and seeded randomized mutations.
- `npm run test:deterministic`: browser checks for page metadata, canonical URLs, navigation, reduced-motion and Save-Data fallbacks, footer update times, the newsletter form, comparable question-entry lengths, and at least two contextual product links per question.
- `npm run test:chaos`: seeded (`1337`) browser backtests across every public route, random viewports, reduced-motion modes, and resource fault injection (font blocking, script delay/block).
- `npm run build:site`: regenerates the question series, species catalog, gallery, social metadata and JSON-LD, normalized footers, `feed.xml`, and `sitemap.xml`.
- `npm run build:artifact`: builds the deployable `_site/` directory (see below).

The browser suites serve the repository root by default. Set `SITE_ROOT=_site`
to test the built artifact instead, as CI does.

## Deployment

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual
dispatch. The `validate` job rebuilds the site, checks for uncommitted generated
files, runs the static and mutation suites, builds the artifact, and runs both
browser suites against it. Pushes to `main` then deploy the artifact to GitHub
Pages and notify IndexNow. The `validate` check must pass before a pull request
can merge.

`npm run build:artifact` copies only public files into `_site/`: the README,
package files, tools, tests, `_data/`, and site configuration are never
published. Root-level files are published only if their extension is listed in
`ROOT_FILE_EXTENSIONS` in `tools/build-pages-artifact.mjs`; HTML, XML, and text
files are already included, which covers search-engine verification files. The
build stamps every footer with the commit time (override with
`SITE_UPDATED_AT`) and fails if any internal link, asset, or sitemap URL does not
resolve inside the artifact.

GitHub Pages must use **GitHub Actions** as its source (Settings > Pages). The
custom domain and HTTPS enforcement live in the Pages settings; `CNAME` stays in
the repository for branch publishing. To roll back to publishing the `main`
branch directly:

```bash
gh api -X PUT repos/ragingpersimmon/glassgardenfins/pages -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"
```

The former domain, littlefinswim.net, is served by the separate
[littlefinswim-redirect](https://github.com/ragingpersimmon/littlefinswim-redirect)
Pages site. It forwards every old URL, with its query string and anchor, to the
same path on glassgardenfins.com. If you retire that domain, delete its DNS
records before deleting the redirect repository: while the records still point
at GitHub Pages, another GitHub account could publish a site on the domain.

Dependabot proposes grouped monthly updates for GitHub Actions and npm.

## Search indexing

`npm run build:site` also maintains index/follow preview directives, aquarium-topic
metadata, journal `ItemList` data, article/video structured data, contextual guide
links, and image/video sitemap entries. The 404 page remains `noindex, follow`.
`feed.xml` is an Atom feed of journal entries, advertised from every page.

After each deployment from `main`, CI compares the live sitemap with the new
build and submits new, re-dated, and removed URLs to
[IndexNow](https://www.indexnow.org/) (Bing, Yandex, Seznam, Naver, and other
participating engines). The key file named by `indexNowKey` in
`site-config.json` must stay published. To preview a submission, run
`npm run build:artifact` and then `npm run indexnow:plan`.

Google does not use IndexNow. The site owner should add `glassgardenfins.com` to
[Google Search Console](https://search.google.com/search-console/) and
[Bing Webmaster Tools](https://www.bing.com/webmasters/), verify ownership, and
submit `https://glassgardenfins.com/sitemap.xml`. Verification credentials should
not be committed to this repository. Indexing and rankings remain controlled by
the search engines.

## Video and data use

Videos load lazily as they approach the viewport. When the browser reports
Save-Data or a connection rated 3G or slower, videos neither autoplay nor
prefetch: they show controls, and nothing downloads until the visitor presses
play. The home-page montage starts paused with its play control available.

## Amazon Associates links

The Associates tracking ID is configured in `site-config.json`. The shared
script adds the tag only to allowlisted Amazon hosts.

Product cards remain text-only until approved Amazon Creators API access is
configured. Do not copy, locally host, or hotlink images from Amazon product
pages; official catalog images must be delivered through Amazon's approved API.

Use `npm run set:amazon-tag -- your-tag-20` to set a tracking ID across
the site, or `npm run set:amazon-tag -- --clear` to disable it. The command
validates the ID, updates `site-config.json`, regenerates every product page,
and keeps `/privacy/` synchronized with the actual commission state.

The site currently has no ad network configured, so `ads.txt` is intentionally
absent. Add provider code only when a network supplies approved publisher
configuration. Do not commit private ad network credentials.

## Newsletter

The signup form is disabled until a provider is configured:

```bash
npm run set:newsletter -- buttondown your-username
npm run set:newsletter -- custom https://provider.example/subscribe [email-field] [provider-name] [--hidden name=value ...]
npm run set:newsletter -- --clear
```

The command validates the settings, updates `site-config.json`, adds a plain
HTML form to every page except `/privacy/` and the 404 page, allows only the
provider's origin in the CSP `form-action`, and updates `/privacy/`. No
third-party script is loaded. If regeneration fails, every file is restored.

Before enabling it, configure the provider's email footer with the sender's
mailing address and contact details required by Canada's Anti-Spam Legislation
(CASL), and keep the provider's unsubscribe link in every email.

## Static-host security boundary

The CSP is delivered through page metadata and contains only directives browsers
enforce from a `<meta>` element. GitHub Pages cannot set custom response headers
for this deployment. Strong framing, HSTS, and reporting headers require a proxy
such as Cloudflare in front of the GitHub Pages origin.
