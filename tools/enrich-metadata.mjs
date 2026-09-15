import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPublicPages } from './generate-sitemap.mjs';

const SITE_ORIGIN = 'https://littlefinswim.net';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/social-card.png`;
const SOCIAL_METADATA = `<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Little Fin Swim planted aquarium journal">
<meta name="twitter:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:image:alt" content="Little Fin Swim planted aquarium journal">`;
const FOOTER = `<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <p>Little Fin Swim — a planted tank log, updated as the tank changes.</p>
    <div class="site-footer__links">
      <a href="/privacy/">Privacy &amp; disclosure</a>
      <a href="#top" class="back-to-top">Back to top ↑</a>
    </div>
  </div>
</footer>`;

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function firstMatch(html, pattern, label, file) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`${file}: missing ${label}`);
  return decodeEntities(value);
}

function schemaFor(html, file) {
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i, 'title', file);
  const description = firstMatch(
    html,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    'description',
    file
  );
  const url = firstMatch(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"/i,
    'canonical URL',
    file
  );
  const article = /<meta\s+property="og:type"\s+content="article"/i.test(html);

  if (url === `${SITE_ORIGIN}/`) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Little Fin Swim',
      alternateName: 'Little Fin Swim — a planted tank journal',
      description,
      url,
      image: SOCIAL_IMAGE
    };
  }

  if (article) {
    const datePublished = firstMatch(
      html,
      /<time[^>]+datetime="([^"]+)"/i,
      'article publication date',
      file
    );
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title.replace(/ — Little Fin Swim$/, ''),
      description,
      datePublished,
      dateModified: datePublished,
      mainEntityOfPage: url,
      url,
      image: SOCIAL_IMAGE,
      author: { '@type': 'Organization', name: 'Little Fin Swim' },
      publisher: { '@type': 'Organization', name: 'Little Fin Swim' }
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title.replace(/ — Little Fin Swim$/, ''),
    description,
    url,
    image: SOCIAL_IMAGE,
    isPartOf: { '@type': 'WebSite', name: 'Little Fin Swim', url: `${SITE_ORIGIN}/` }
  };
}

export function enrichPage(html, file, amazonAssociateTag) {
  let output = html
    .replace(/\s*<meta\s+name="theme-color"[^>]*>/gi, '')
    .replace(/\s*<meta\s+property="og:site_name"[^>]*>/gi, '')
    .replace(/\s*<meta\s+property="og:image[^>]*>/gi, '')
    .replace(/\s*<meta\s+name="twitter:image[^>]*>/gi, '')
    .replace(/\s*<script\s+type="application\/ld\+json"\s+data-site-schema>[\s\S]*?<\/script>/gi, '')
    .replace(/\sframe-ancestors\s+[^;"]+;?/gi, '')
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/i, FOOTER);

  output = output.replace(
    /(<meta\s+name="viewport"[^>]*>)/i,
    '$1\n<meta name="theme-color" content="#0A1614">'
  );
  output = output.replace(
    /(<meta\s+property="og:type"[^>]*>)/i,
    '$1\n<meta property="og:site_name" content="Little Fin Swim">'
  );
  output = output.replace(
    /<meta\s+name="twitter:card"\s+content="[^"]+">/i,
    '<meta name="twitter:card" content="summary_large_image">'
  );
  output = output.replace(
    /(<meta\s+name="twitter:description"[^>]*>)/i,
    `$1\n${SOCIAL_METADATA}`
  );

  const schema = JSON.stringify(schemaFor(output, file), null, 2).replace(/</g, '\\u003c');
  output = output.replace(
    /(<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com">)/i,
    `<script type="application/ld+json" data-site-schema>\n${schema}\n</script>\n$1`
  );

  if (/data-amazon-link/.test(output)) {
    if (/<meta\s+name="amazon-associate-tag"/i.test(output)) {
      output = output.replace(
        /<meta\s+name="amazon-associate-tag"\s+content="[^"]*">/i,
        `<meta name="amazon-associate-tag" content="${amazonAssociateTag}">`
      );
    } else {
      output = output.replace(
        /(<meta\s+name="theme-color"[^>]*>)/i,
        `$1\n<meta name="amazon-associate-tag" content="${amazonAssociateTag}">`
      );
    }
  }

  if (file.replaceAll('\\', '/') === 'privacy/index.html') {
    const status = amazonAssociateTag
      ? 'Amazon product links are configured as sponsored affiliate links. Little Fin Swim may earn from qualifying purchases at no extra cost to the visitor.'
      : 'Amazon product links are currently ordinary, untagged links. Little Fin Swim does not currently earn a commission from them.';
    output = output.replace(
      /<p data-affiliate-status>[\s\S]*?<\/p>/i,
      `<p data-affiliate-status>${status}</p>`
    );
  }

  return `${output.trim()}\n`;
}

export function enrichSite(repoRoot) {
  const config = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site-config.json'), 'utf8'));
  const publicPages = discoverPublicPages(repoRoot);
  const scheduledRoot = path.join(repoRoot, '_scheduled');
  const scheduledPages = fs.existsSync(scheduledRoot)
    ? fs.readdirSync(scheduledRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        file: path.join('_scheduled', entry.name, 'index.html'),
        route: null
      }))
    : [];

  for (const { file } of [...publicPages, ...scheduledPages]) {
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute)) continue;
    const html = fs.readFileSync(absolute, 'utf8');
    const updated = enrichPage(html, file, config.amazonAssociateTag || '');
    const temporary = `${absolute}.tmp`;
    fs.writeFileSync(temporary, updated);
    fs.renameSync(temporary, absolute);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  enrichSite(process.cwd());
  console.log('Enriched page metadata, schemas, affiliate state, and footers.');
}
