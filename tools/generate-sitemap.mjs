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
    return { ...page, date };
  });
  const latestContentDate = datedPages
    .map(({ date }) => date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const urls = datedPages
    .map(({ route, date }) => `  <url>\n    <loc>${SITE_ORIGIN}${route}</loc>\n    <lastmod>${date || latestContentDate}</lastmod>\n  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(repoRoot, 'sitemap.xml'), xml);
  return xml;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  generateSitemap(process.cwd());
  console.log('Generated sitemap.xml from public page routes.');
}
