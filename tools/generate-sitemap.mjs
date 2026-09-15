import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://littlefinswim.net';
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.github',
  '_scheduled',
  'assets',
  'node_modules',
  'tests',
  'tools'
]);

function xmlEscape(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function attribute(attributes, name) {
  return attributes.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'))?.[1] || null;
}

function mediaEntries(html) {
  const images = Array.from(html.matchAll(/<img\b([^>]*)>/gi))
    .map(([, attributes]) => ({
      src: attribute(attributes, 'src'),
      alt: attribute(attributes, 'alt')
    }))
    .filter(({ src }) => src?.startsWith('/assets/media/'));
  const videos = Array.from(html.matchAll(
    /<video\b([^>]*)>([\s\S]*?)<\/video>\s*(?:<figcaption>([^<]+)<\/figcaption>)?/gi
  ))
    .map(([, attributes, body, caption]) => ({
      title: attribute(attributes, 'aria-label'),
      description: caption || attribute(attributes, 'aria-label'),
      poster: attribute(attributes, 'poster'),
      duration: attribute(attributes, 'data-duration'),
      src: body.match(/<source[^>]+src="([^"]+)"/i)?.[1] || null
    }))
    .filter(({ title, poster, src }) => title && poster && src);
  return { images, videos };
}

function renderMedia({ images, videos }) {
  const imageXml = images.map(({ src, alt }) => {
    const caption = alt ? `\n      <image:caption>${xmlEscape(alt)}</image:caption>` : '';
    return `    <image:image>\n      <image:loc>${SITE_ORIGIN}${xmlEscape(src)}</image:loc>${caption}\n    </image:image>`;
  });
  const videoXml = videos.map(({ title, description, poster, duration, src }) => {
    const durationValue = duration?.match(/^PT([\d.]+)S$/i)?.[1];
    const seconds = durationValue ? Math.round(Number(durationValue)) : null;
    const durationXml = seconds ? `\n      <video:duration>${seconds}</video:duration>` : '';
    return `    <video:video>
      <video:thumbnail_loc>${SITE_ORIGIN}${xmlEscape(poster)}</video:thumbnail_loc>
      <video:title>${xmlEscape(title)}</video:title>
      <video:description>${xmlEscape(description)}</video:description>
      <video:content_loc>${SITE_ORIGIN}${xmlEscape(src)}</video:content_loc>${durationXml}
    </video:video>`;
  });
  return [...imageXml, ...videoXml].join('\n');
}

export function discoverPublicPages(repoRoot) {
  const pages = [];

  function visit(directory, relativeDirectory = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.join(relativeDirectory, entry.name);

      if (entry.isDirectory()) {
        visit(absolute, relative);
      } else if (entry.isFile() && entry.name === 'index.html') {
        const routeDirectory = relativeDirectory.split(path.sep).filter(Boolean).join('/');
        pages.push({
          file: relative.replaceAll(path.sep, '/'),
          route: routeDirectory ? `/${routeDirectory}/` : '/'
        });
      }
    }
  }

  visit(repoRoot);
  const errorPage = path.join(repoRoot, '404.html');
  if (fs.existsSync(errorPage)) {
    pages.push({ file: '404.html', route: '/404.html', sitemap: false });
  }
  return pages.sort((a, b) => a.route.localeCompare(b.route));
}

export function generateSitemap(repoRoot) {
  const pages = discoverPublicPages(repoRoot).filter(({ sitemap }) => sitemap !== false);
  const datedPages = pages.map((page) => {
    const html = fs.readFileSync(path.join(repoRoot, page.file), 'utf8');
    const date = html.match(/<time[^>]+datetime="(\d{4}-\d{2}-\d{2})"/i)?.[1] || null;
    return { ...page, date, media: mediaEntries(html) };
  });
  const latestContentDate = datedPages
    .map(({ date }) => date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const urls = datedPages
    .map(({ route, date, media }) => {
      const renderedMedia = renderMedia(media);
      return `  <url>
    <loc>${SITE_ORIGIN}${route}</loc>
    <lastmod>${date || latestContentDate}</lastmod>${renderedMedia ? `\n${renderedMedia}` : ''}
  </url>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(repoRoot, 'sitemap.xml'), xml);
  return xml;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  generateSitemap(process.cwd());
  console.log('Generated sitemap.xml from public page routes.');
}
