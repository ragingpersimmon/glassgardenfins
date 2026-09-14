import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RELEASE_DATE = '2026-09-15';
const SLUG = 'september-15-stocking-update';
const JOURNAL_MARKER = '<!-- scheduled-entry:2026-09-15 -->';
const LATEST_START = '<!-- latest-entry:start -->';
const LATEST_END = '<!-- latest-entry:end -->';
const STOCKING_START = '<!-- stocking:start -->';
const STOCKING_END = '<!-- stocking:end -->';

function replaceBetweenMarkers(content, startMarker, endMarker, fragment, label) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${label} markers are missing or invalid`);
  }

  return [
    content.slice(0, start + startMarker.length),
    '\n',
    fragment.trim(),
    '\n        ',
    content.slice(end)
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
  const tankPath = path.join(repoRoot, 'tank', 'index.html');
  const card = fs.readFileSync(path.join(sourceDir, 'card.html'), 'utf8').trim();
  const latest = fs.readFileSync(path.join(sourceDir, 'home-update.html'), 'utf8').trim();
  const stocking = fs.readFileSync(path.join(sourceDir, 'tank-stocking.html'), 'utf8').trim();
  let journal = fs.readFileSync(journalPath, 'utf8');
  let home = fs.readFileSync(homePath, 'utf8');
  let tank = fs.readFileSync(tankPath, 'utf8');

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
    home = replaceBetweenMarkers(home, LATEST_START, LATEST_END, latest, 'Homepage latest-entry');
    fs.writeFileSync(homePath, home);
  }

  if (!tank.includes('5 Thai micro spider crabs')) {
    tank = replaceBetweenMarkers(
      tank,
      STOCKING_START,
      STOCKING_END,
      stocking,
      'Tank stocking'
    );
    fs.writeFileSync(tankPath, tank);
  }

  return { published: true, reason: `released ${SLUG}` };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = publishScheduledEntry(process.cwd());
  console.log(result.reason);
}
