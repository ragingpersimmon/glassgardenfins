import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RELEASE_DATE = '2026-09-15';
const SLUG = 'september-15-stocking-update';
const JOURNAL_MARKER = '<!-- scheduled-entry:2026-09-15 -->';
const LATEST_START = '<!-- latest-entry:start -->';
const LATEST_END = '<!-- latest-entry:end -->';

function replaceLatestEntry(home, fragment) {
  const start = home.indexOf(LATEST_START);
  const end = home.indexOf(LATEST_END);

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Homepage latest-entry markers are missing or invalid');
  }

  return [
    home.slice(0, start + LATEST_START.length),
    '\n',
    fragment.trim(),
    '\n        ',
    home.slice(end)
  ].join('');
}

export function publishScheduledEntry(repoRoot, today = new Date().toISOString().slice(0, 10)) {
  if (today < RELEASE_DATE) {
    return { published: false, reason: `not due until ${RELEASE_DATE}` };
  }

  const sourceDir = path.join(repoRoot, '_scheduled', `${RELEASE_DATE}-stocking-update`);
  const destinationDir = path.join(repoRoot, 'journal', SLUG);
  const journalPath = path.join(repoRoot, 'journal', 'index.html');
  const homePath = path.join(repoRoot, 'index.html');
  const card = fs.readFileSync(path.join(sourceDir, 'card.html'), 'utf8').trim();
  const latest = fs.readFileSync(path.join(sourceDir, 'home-update.html'), 'utf8').trim();
  let journal = fs.readFileSync(journalPath, 'utf8');
  let home = fs.readFileSync(homePath, 'utf8');

  if (!journal.includes(JOURNAL_MARKER)) {
    throw new Error(`Journal marker is missing: ${JOURNAL_MARKER}`);
  }

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.copyFileSync(path.join(sourceDir, 'index.html'), path.join(destinationDir, 'index.html'));

  if (!journal.includes(`data-entry-slug="${SLUG}"`)) {
    journal = journal.replace(JOURNAL_MARKER, `${JOURNAL_MARKER}\n        ${card}`);
    fs.writeFileSync(journalPath, journal);
  }

  if (!home.includes(`/journal/${SLUG}/`)) {
    home = replaceLatestEntry(home, latest);
    fs.writeFileSync(homePath, home);
  }

  return { published: true, reason: `released ${SLUG}` };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = publishScheduledEntry(process.cwd());
  console.log(result.reason);
}
