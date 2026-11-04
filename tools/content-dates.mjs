import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CONTENT_DATES_FILE = path.join('_data', 'content-dates.json');

// A page's "significant" content: what search engines treat as a meaningful
// change (title, description, main text, and the links and media it references).
// Markup-only rewrites such as lazy-video attributes, head metadata, navigation,
// or footer changes deliberately leave the fingerprint unchanged.
export function contentFingerprint(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? '';
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  const text = main
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const references = Array.from(
    main.matchAll(/\b(?:href|src|data-src|poster)="([^"]+)"/gi),
    (match) => match[1]
  );
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([title, description, text, references]))
    .digest('hex')
    .slice(0, 16);
}

export function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

export function readContentDates(repoRoot) {
  const file = path.join(repoRoot, CONTENT_DATES_FILE);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

export function serializeContentDates(record) {
  const ordered = Object.fromEntries(
    Object.keys(record).sort().map((route) => [route, record[route]])
  );
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

function writeContentDates(repoRoot, record) {
  const file = path.join(repoRoot, CONTENT_DATES_FILE);
  const serialized = serializeContentDates(record);
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === serialized) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, serialized);
  fs.renameSync(temporary, file);
}

// Computes the record for the current pages. A route keeps its stored date
// while its fingerprint is unchanged, so rebuilding without content changes is
// a no-op; changed or new routes are dated today (UTC); removed routes drop out.
// options.readPage(file) supplies HTML that is not on disk yet (enrich output).
export function computeContentDates(
  repoRoot,
  pages,
  { today = utcToday(), readPage = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8') } = {}
) {
  const previous = readContentDates(repoRoot);
  const next = {};
  for (const { file, route, sitemap } of pages) {
    if (sitemap === false) continue;
    const fingerprint = contentFingerprint(readPage(file));
    const known = previous[route];
    next[route] = known?.fingerprint === fingerprint && /^\d{4}-\d{2}-\d{2}$/.test(known.lastmod ?? '')
      ? { fingerprint, lastmod: known.lastmod }
      : { fingerprint, lastmod: today };
  }
  return next;
}

// Updates _data/content-dates.json when content changed and returns
// route -> last significant modification date (YYYY-MM-DD).
export function resolveContentDates(repoRoot, pages, options = {}) {
  const record = computeContentDates(repoRoot, pages, options);
  writeContentDates(repoRoot, record);
  return new Map(Object.entries(record).map(([route, { lastmod }]) => [route, lastmod]));
}

export function articlePublishedDate(html) {
  if (!/<meta\s+property="og:type"\s+content="article"/i.test(html)) return null;
  return html.match(/<time[^>]+datetime="(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
}

// Articles never report a modification earlier than their publication date.
export function effectiveLastmod(html, contentDate) {
  return [contentDate, articlePublishedDate(html)].filter(Boolean).sort().at(-1) ?? null;
}

function git(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024
  });
}

// Bootstraps the record from history: each route is dated by the latest commit
// on the published branch's first-parent chain (when a change actually went
// live) that changed its fingerprint. Uncommitted content changes date today.
export function seedContentDatesFromGit(repoRoot, pages, { ref = 'HEAD', today = utcToday() } = {}) {
  const chain = git(repoRoot, ['log', '--first-parent', '--format=%H %cI', ref])
    .trim()
    .split('\n')
    .map((line) => {
      const [hash, committed] = line.split(' ');
      return { hash, date: new Date(committed).toISOString().slice(0, 10) };
    });
  const sitemapPages = pages.filter(({ sitemap }) => sitemap !== false);
  const files = sitemapPages.map(({ file }) => file);
  const blobsByCommit = chain.map(({ hash }) => new Map(
    git(repoRoot, ['ls-tree', '-r', hash, '--', ...files])
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [meta, file] = line.split('\t');
        return [file, meta.split(' ')[2]];
      })
  ));
  const fingerprints = new Map();
  const fingerprintOf = (blob) => {
    if (!fingerprints.has(blob)) {
      fingerprints.set(blob, contentFingerprint(git(repoRoot, ['cat-file', 'blob', blob])));
    }
    return fingerprints.get(blob);
  };

  const record = {};
  for (const { file, route } of sitemapPages) {
    const current = contentFingerprint(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
    const blobs = blobsByCommit.map((blobsAtCommit) => blobsAtCommit.get(file) ?? null);
    let lastmod = today;
    if (blobs[0] && fingerprintOf(blobs[0]) === current) {
      for (let index = 0; index < chain.length; index += 1) {
        const newer = blobs[index];
        const older = blobs[index + 1] ?? null;
        if (newer === older) continue;
        if (older === null || fingerprintOf(newer) !== fingerprintOf(older)) {
          lastmod = chain[index].date;
          break;
        }
      }
    }
    record[route] = { fingerprint: current, lastmod };
  }
  writeContentDates(repoRoot, record);
  return record;
}
