import fs from 'node:fs';
import path from 'node:path';
import { PAGE_DEFS, SITE_ORIGIN, checkPage, readProjectPage } from './invariants.mjs';
import { discoverPublicPages } from './generate-sitemap.mjs';

const repoRoot = process.cwd();
let failures = 0;

for (const page of PAGE_DEFS) {
  const html = readProjectPage(repoRoot, page.file);
  const errors = checkPage(html, page);
  if (errors.length) {
    failures += errors.length;
    console.error(`\n❌ ${page.file}`);
    for (const err of errors) console.error(`  - ${err}`);
  } else {
    console.log(`✅ ${page.file}`);
  }
}

const publicPages = discoverPublicPages(repoRoot);
const declaredRoutes = new Set(PAGE_DEFS.map(({ route }) => route));
const discoveredRoutes = new Set(publicPages.map(({ route }) => route));
const sitemapRoutes = new Set(
  publicPages.filter(({ sitemap }) => sitemap !== false).map(({ route }) => route)
);

for (const route of discoveredRoutes) {
  if (!declaredRoutes.has(route)) {
    failures += 1;
    console.error(`\n❌ unvalidated public route: ${route}`);
  }
}
for (const route of declaredRoutes) {
  if (!discoveredRoutes.has(route)) {
    failures += 1;
    console.error(`\n❌ PAGE_DEFS route has no file: ${route}`);
  }
}

const titles = new Map();
const descriptions = new Map();
const inboundRoutes = new Set(['/']);
for (const page of PAGE_DEFS) {
  const html = readProjectPage(repoRoot, page.file);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  for (const [value, label, seen] of [
    [title, 'title', titles],
    [description, 'description', descriptions]
  ]) {
    if (!value) continue;
    if (seen.has(value)) {
      failures += 1;
      console.error(`\n❌ duplicate ${label}: ${page.file} and ${seen.get(value)}`);
    } else {
      seen.set(value, page.file);
    }
  }

  for (const match of html.matchAll(/href="(\/[^"#?]*)/gi)) {
    let link = match[1];
    if (link === '/') {
      inboundRoutes.add(link);
      continue;
    }
    if (path.extname(link)) continue;
    if (!link.endsWith('/')) link += '/';
    inboundRoutes.add(link);
    if (!discoveredRoutes.has(link)) {
      failures += 1;
      console.error(`\n❌ dead internal link in ${page.file}: ${link}`);
    }
  }
}

for (const route of discoveredRoutes) {
  if (route !== '/' && route !== '/404.html' && !inboundRoutes.has(route)) {
    failures += 1;
    console.error(`\n❌ orphaned route: ${route}`);
  }
}

const robotsPath = path.join(repoRoot, 'robots.txt');
if (!fs.existsSync(robotsPath) ||
    !/Sitemap:\s+https:\/\/littlefinswim\.net\/sitemap\.xml/i.test(fs.readFileSync(robotsPath, 'utf8'))) {
  failures += 1;
  console.error('\n❌ robots.txt is missing or does not advertise sitemap.xml');
}

const sitemapPath = path.join(repoRoot, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  failures += 1;
  console.error('\n❌ sitemap.xml is missing');
} else {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const route of sitemapRoutes) {
    const url = `https://littlefinswim.net${route}`;
    if (!sitemap.includes(`<loc>${url}</loc>`)) {
      failures += 1;
      console.error(`\n❌ sitemap.xml missing ${url}`);
    }
  }
  const sitemapEntries = Array.from(
    sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g),
    (match) => match[1]
  );
  const sitemapDates = Array.from(
    sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g),
    (match) => match[1]
  );
  if (sitemapEntries.length !== sitemapRoutes.size) {
    failures += 1;
    console.error('\n❌ sitemap.xml contains stale or duplicate routes');
  }
  if (sitemapDates.length !== sitemapRoutes.size ||
      sitemapDates.some((date) => date > new Date().toISOString().slice(0, 10))) {
    failures += 1;
    console.error('\n❌ sitemap.xml requires one non-future lastmod per route');
  }
  const expectedSitemapMedia = [
    '/assets/media/amano-shrimp-poster.webp',
    '/assets/media/red-bristlenose-pleco-foraging.mp4',
    '/assets/media/shrimp-open-water-swimming.mp4',
    '/assets/media/shrimp-moss-grazing.mp4',
    '/assets/media/corydoras-group-foraging.mp4',
    '/assets/media/amano-shrimp-stabilized.mp4',
    '/assets/media/stocking-shrimp-stabilized.mp4'
  ];
  if (!sitemap.includes('xmlns:image=') ||
      !sitemap.includes('xmlns:video=') ||
      expectedSitemapMedia.some((media) => !sitemap.includes(`${SITE_ORIGIN}${media}`))) {
    failures += 1;
    console.error('\n❌ sitemap.xml is missing image or video discovery metadata');
  }
}

const socialCardPath = path.join(repoRoot, 'assets', 'social-card.png');
if (!fs.existsSync(socialCardPath)) {
  failures += 1;
  console.error('\n❌ social image is missing');
} else {
  const png = fs.readFileSync(socialCardPath);
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    failures += 1;
    console.error('\n❌ social image must be exactly 1200×630');
  }
}

const script = fs.readFileSync(path.join(repoRoot, 'script.js'), 'utf8');
if (!script.includes('/^[a-z0-9-]{1,64}$/i') ||
    !script.includes("'www.amazon.com'") ||
    !script.includes("'www.amazon.ca'") ||
    /\binnerHTML\b/.test(script)) {
  failures += 1;
  console.error('\n❌ affiliate injection allowlist, tag validation, or DOM-write invariant failed');
}

const config = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site-config.json'), 'utf8'));
if (config.amazonAssociateTag &&
    !/^[a-z0-9-]{1,64}$/i.test(config.amazonAssociateTag)) {
  failures += 1;
  console.error('\n❌ configured Amazon Associates tag is invalid');
}

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f0-9]{2}/gi).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const css = fs.readFileSync(path.join(repoRoot, 'style.css'), 'utf8');
const faintText = css.match(/--color-text-faint:\s*(#[a-f0-9]{6})/i)?.[1];
const backgrounds = Array.from(
  css.matchAll(/--color-bg(?:-alt|-panel)?:\s*(#[a-f0-9]{6})/gi),
  (match) => match[1]
);
if (!faintText || backgrounds.length !== 3) {
  failures += 1;
  console.error('\n❌ unable to resolve text/background contrast tokens');
} else {
  for (const background of backgrounds) {
    const ratio = contrastRatio(faintText, background);
    if (ratio < 4.5) {
      failures += 1;
      console.error(`\n❌ ${faintText} contrast on ${background} is ${ratio.toFixed(2)}:1`);
    }
  }
}

if (failures > 0) {
  console.error(`\nValidation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nAll deterministic checks passed.');
