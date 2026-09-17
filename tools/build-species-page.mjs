import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from './site-config.mjs';

const repoRoot = process.cwd();
const speciesPath = path.join(repoRoot, '_data', 'species.json');
const outputPath = path.join(repoRoot, 'species', 'index.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMedia(species) {
  if (!species.video) {
    return `<div class="species-video-placeholder" role="img" aria-label="${escapeHtml(species.name)} video to be added">
            <span>species video</span>
            <strong>to be added</strong>
          </div>`;
  }

  return `<video autoplay muted loop playsinline preload="metadata" poster="${escapeHtml(species.video.poster)}" aria-label="${escapeHtml(species.video.label)}" data-duration="${escapeHtml(species.video.duration)}">
            <source src="${escapeHtml(species.video.src)}" type="video/mp4">
            Your browser does not support embedded video.
          </video>`;
}

function validateSpecies(species) {
  const slugs = new Set();
  const videos = new Set();

  for (const entry of species) {
    if (!entry.slug || !entry.name || !Number.isInteger(entry.quantity) || entry.quantity < 1) {
      throw new Error(`Invalid species record: ${JSON.stringify(entry)}`);
    }
    if (slugs.has(entry.slug)) throw new Error(`Duplicate species slug: ${entry.slug}`);
    slugs.add(entry.slug);

    if (!entry.video) continue;
    for (const field of ['src', 'poster', 'label', 'duration']) {
      if (!entry.video[field]) throw new Error(`${entry.slug}: video.${field} is required`);
    }
    if (videos.has(entry.video.src)) throw new Error(`Duplicate species video: ${entry.video.src}`);
    videos.add(entry.video.src);
  }
}

function renderCard(species) {
  const scientificName = species.scientificName
    ? `<p class="species-card__scientific preserve-case">${escapeHtml(species.scientificName)}</p>`
    : '';
  const countLabel = species.quantity === 1 ? '1 resident' : `${species.quantity} residents`;

  return `      <article class="species-card" id="${escapeHtml(species.slug)}" data-species-name="${escapeHtml(species.name)}">
        <div class="species-card__media">
          ${renderMedia(species)}
        </div>
        <div class="species-card__body">
          <p class="species-card__count">${countLabel}</p>
          <h2 class="species-card__title">${escapeHtml(species.name)}</h2>
          ${scientificName}
          <p class="species-card__note">${escapeHtml(species.note)}</p>
        </div>
      </article>`;
}

export function buildSpeciesPage() {
  const species = JSON.parse(fs.readFileSync(speciesPath, 'utf8'));
  validateSpecies(species);
  const cards = species.map(renderCard).join('\n');
  const csp = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Species — Glass Garden Fins</title>
<meta name="description" content="Meet the fish, shrimp, crabs, and snails currently living in the Glass Garden Fins planted aquarium.">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="canonical" href="${SITE_ORIGIN}/species/">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_ORIGIN}/species/">
<meta property="og:title" content="Species — Glass Garden Fins">
<meta property="og:description" content="Meet the fish, shrimp, crabs, and snails currently living in the planted aquarium.">
<meta name="twitter:card" content="summary">
<meta name="twitter:url" content="${SITE_ORIGIN}/species/">
<meta name="twitter:title" content="Species — Glass Garden Fins">
<meta name="twitter:description" content="Meet the fish, shrimp, crabs, and snails currently living in the planted aquarium.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body class="species-index-page">
<a class="skip-link" href="#top">Skip to content</a>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a href="/" class="wordmark">Glass Garden Fins</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/tank/">The Tank</a>
      <a href="/journal/">Journal</a>
      <a href="/species/" aria-current="page">Species</a>
    </nav>
  </div>
</header>
<main id="top" class="page-main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Current residents</p>
      <h1 class="section-title section-title--compact">Species</h1>
      <p class="page-hero__lead">The fish, shrimp, crabs, and snails living in the 70L planted aquarium. Each resident will receive its own original video as the library grows.</p>
    </div>
  </section>
  <section class="species" aria-labelledby="species-list-title">
    <div class="wrap">
      <h2 id="species-list-title" class="visually-hidden">Current aquarium species</h2>
      <div class="species-grid">
${cards}
      </div>
    </div>
  </section>
  <nav class="page-nav page-nav--subpage" aria-label="Explore more">
    <div class="wrap">
      <ul class="page-nav__list">
        <li><a class="page-nav__link" href="/tank/"><span class="page-nav__title">The Tank</span><span class="page-nav__desc">Review the equipment, plants, and current livestock counts.</span></a></li>
        <li><a class="page-nav__link" href="/journal/"><span class="page-nav__title">Journal</span><span class="page-nav__desc">Follow stocking notes, water chemistry, and aquarium changes.</span></a></li>
      </ul>
    </div>
  </nav>
</main>
<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <p>Glass Garden Fins — a planted tank log, updated as the tank changes.</p>
    <a href="#top" class="back-to-top">Back to top ↑</a>
  </div>
</footer>
<script src="/script.js"></script>
</body>
</html>
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  return species.length;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const count = buildSpeciesPage();
  console.log(`Built species catalog with ${count} current residents.`);
}
