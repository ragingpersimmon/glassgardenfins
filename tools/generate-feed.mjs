import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articlePublishedDate, effectiveLastmod, resolveContentDates } from './content-dates.mjs';
import { discoverPublicPages } from './generate-sitemap.mjs';
import { SITE_ORIGIN } from './site-config.mjs';

export const FEED_FILE = 'feed.xml';
export const FEED_URL = `${SITE_ORIGIN}/${FEED_FILE}`;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  times: '×',
  deg: '°'
};

export function decodeHtml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === '#') {
      const codePoint = name[1].toLowerCase() === 'x'
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10);
      return String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
  });
}

function xmlText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function xmlAttribute(value) {
  return xmlText(value).replaceAll('"', '&quot;');
}

// Dates only carry a day; noon UTC keeps the calendar day stable for readers
// in every timezone from UTC-11 to UTC+11.
function atomTimestamp(day) {
  return `${day}T12:00:00Z`;
}

// options.contentDates: route -> date map; validation passes the stored record
// so checking the feed never rewrites it.
export function feedEntries(repoRoot, { contentDates } = {}) {
  const publicPages = discoverPublicPages(repoRoot);
  const dates = contentDates ?? resolveContentDates(repoRoot, publicPages);
  return publicPages
    .filter(({ sitemap }) => sitemap !== false)
    .map((page) => ({ ...page, html: fs.readFileSync(path.join(repoRoot, page.file), 'utf8') }))
    .filter(({ html }) => articlePublishedDate(html))
    .map(({ route, html, file }) => {
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
      const summary = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
      if (!title || !summary) throw new Error(`${file}: feed entries need a title and description`);
      return {
        route,
        url: `${SITE_ORIGIN}${route}`,
        title: decodeHtml(title).replace(/ — Glass Garden Fins$/, '').trim(),
        summary: decodeHtml(summary).trim(),
        category: decodeHtml(html.match(/<span\s+class="entry__tag">([^<]+)<\/span>/i)?.[1] ?? '').trim(),
        published: articlePublishedDate(html),
        updated: effectiveLastmod(html, dates.get(route))
      };
    })
    .sort((a, b) => b.published.localeCompare(a.published) || a.route.localeCompare(b.route));
}

export function renderFeed(entries) {
  const updated = entries.map((entry) => entry.updated).sort().at(-1);
  const renderedEntries = entries.map((entry) => `  <entry>
    <title>${xmlText(entry.title)}</title>
    <link rel="alternate" type="text/html" href="${xmlAttribute(entry.url)}"/>
    <id>${xmlText(entry.url)}</id>
    <published>${atomTimestamp(entry.published)}</published>
    <updated>${atomTimestamp(entry.updated)}</updated>${entry.category ? `\n    <category term="${xmlAttribute(entry.category)}"/>` : ''}
    <summary>${xmlText(entry.summary)}</summary>
  </entry>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-CA">
  <title>Glass Garden Fins journal</title>
  <subtitle>Field notes and practical guides from a 70L planted freshwater aquarium.</subtitle>
  <link rel="self" type="application/atom+xml" href="${FEED_URL}"/>
  <link rel="alternate" type="text/html" href="${SITE_ORIGIN}/journal/"/>
  <id>${FEED_URL}</id>
  <updated>${atomTimestamp(updated)}</updated>
  <author>
    <name>Glass Garden Fins</name>
    <uri>${SITE_ORIGIN}/</uri>
  </author>
  <icon>${SITE_ORIGIN}/favicon.ico</icon>
  <logo>${SITE_ORIGIN}/assets/social-card.png</logo>
${renderedEntries}
</feed>
`;
}

export function generateFeed(repoRoot) {
  const entries = feedEntries(repoRoot);
  if (!entries.length) throw new Error('No journal articles found for feed.xml');
  const xml = renderFeed(entries);
  const file = path.join(repoRoot, FEED_FILE);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== xml) {
    fs.writeFileSync(file, xml);
  }
  return { xml, entries };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const { entries } = generateFeed(process.cwd());
  console.log(`Generated feed.xml with ${entries.length} journal entries.`);
}
