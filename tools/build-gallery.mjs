import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from './site-config.mjs';

const repoRoot = process.cwd();
const galleryPath = path.join(repoRoot, '_data', 'gallery.json');
const outputPath = path.join(repoRoot, 'gallery', 'index.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validatePhotos(photos) {
  for (const entry of photos) {
    if (!entry.src || !entry.src.startsWith('/assets/')) {
      throw new Error(`Invalid gallery photo src: ${JSON.stringify(entry)}`);
    }
    if (!entry.alt || !entry.caption) {
      throw new Error(`Gallery photo needs alt and caption: ${JSON.stringify(entry)}`);
    }
    if (!Number.isInteger(entry.width) || !Number.isInteger(entry.height)) {
      throw new Error(`Gallery photo needs integer width/height: ${JSON.stringify(entry)}`);
    }
    const file = path.join(repoRoot, entry.src);
    if (!fs.existsSync(file)) {
      throw new Error(`Gallery photo file missing: ${entry.src}`);
    }
  }
}

function renderPhoto(photo) {
  const date = photo.date
    ? ` <time datetime="${escapeHtml(photo.date)}">${escapeHtml(photo.date)}</time>`
    : '';
  return `        <figure class="gallery-card">
          <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async">
          <figcaption>${escapeHtml(photo.caption)}${date}</figcaption>
        </figure>`;
}

export function buildGalleryPage() {
  const photos = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  validatePhotos(photos);
  const cards = photos.length
    ? photos.map(renderPhoto).join('\n')
    : '        <p class="gallery-empty">High-resolution photos are on the way as new shots are selected.</p>';
  const csp = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gallery — Glass Garden Fins</title>
<meta name="description" content="High-resolution photos of the fish, shrimp, crabs, and snails living in the Glass Garden Fins planted aquarium.">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="canonical" href="${SITE_ORIGIN}/gallery/">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_ORIGIN}/gallery/">
<meta property="og:title" content="Gallery — Glass Garden Fins">
<meta property="og:description" content="High-resolution photos from the planted aquarium.">
<meta name="twitter:card" content="summary">
<meta name="twitter:url" content="${SITE_ORIGIN}/gallery/">
<meta name="twitter:title" content="Gallery — Glass Garden Fins">
<meta name="twitter:description" content="High-resolution photos from the planted aquarium.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body class="gallery-page">
<a class="skip-link" href="#top">Skip to content</a>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a href="/" class="wordmark">Glass Garden Fins</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/tank/">The Tank</a>
      <a href="/journal/">Journal</a>
      <a href="/species/">Species</a>
      <a href="/gallery/" aria-current="page">Gallery</a>
    </nav>
  </div>
</header>
<main id="top" class="page-main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Still frames</p>
      <h1 class="section-title section-title--compact">Gallery</h1>
      <p class="page-hero__lead">High-resolution photos of the tank's residents, selected from the original photo library.</p>
    </div>
  </section>
  <section class="gallery" aria-labelledby="gallery-list-title">
    <div class="wrap">
      <h2 id="gallery-list-title" class="visually-hidden">Aquarium photo gallery</h2>
      <div class="gallery-grid">
${cards}
      </div>
    </div>
  </section>
  <nav class="page-nav page-nav--subpage" aria-label="Explore more">
    <div class="wrap">
      <ul class="page-nav__list">
        <li><a class="page-nav__link" href="/species/"><span class="page-nav__title">Species</span><span class="page-nav__desc">Meet the current residents and watch original footage.</span></a></li>
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
  return photos.length;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const count = buildGalleryPage();
  console.log(`Built gallery with ${count} photo${count === 1 ? '' : 's'}.`);
}
