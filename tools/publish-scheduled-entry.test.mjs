import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkPage } from './invariants.mjs';
import { publishScheduledEntry } from './publish-scheduled-entry.mjs';

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'littlefinswim-scheduled-'));

try {
  const scheduledPage = fs.readFileSync(
    path.join(
      process.cwd(),
      '_scheduled',
      '2026-09-15-stocking-update',
      'index.html'
    ),
    'utf8'
  );
  assert.deepStrictEqual(
    checkPage(scheduledPage, {
      route: '/journal/september-15-stocking-update/',
      current: '/journal/'
    }),
    [],
    'scheduled entry should satisfy site invariants before release'
  );

  const sourceDir = path.join(fixtureRoot, '_scheduled', '2026-09-15-stocking-update');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, 'journal'), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'index.html'), '<main>scheduled entry</main>');
  fs.writeFileSync(
    path.join(sourceDir, 'card.html'),
    '<article data-entry-slug="september-15-stocking-update">card</article>'
  );
  fs.writeFileSync(path.join(sourceDir, 'home-update.html'), '<p>new latest entry</p>');
  fs.writeFileSync(path.join(sourceDir, 'tank-stocking.html'), '<p>5 Thai micro spider crabs</p>');
  fs.writeFileSync(
    path.join(fixtureRoot, 'journal', 'index.html'),
    '<div><!-- scheduled-entry:2026-09-15 --><article>existing entry</article></div>'
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'index.html'),
    '<div><!-- latest-entry:start --><p>old</p><!-- latest-entry:end --></div>'
  );
  fs.mkdirSync(path.join(fixtureRoot, 'tank'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureRoot, 'tank', 'index.html'),
    '<div><!-- stocking:start --><p>old plan</p><!-- stocking:end --></div>'
  );

  const early = publishScheduledEntry(fixtureRoot, '2026-09-14');
  assert.strictEqual(early.published, false);
  assert.strictEqual(
    fs.existsSync(path.join(fixtureRoot, 'journal', 'september-15-stocking-update', 'index.html')),
    false,
    'entry must not publish before its release date'
  );

  const due = publishScheduledEntry(fixtureRoot, '2026-09-15');
  assert.strictEqual(due.published, true);
  assert.match(
    fs.readFileSync(path.join(fixtureRoot, 'journal', 'index.html'), 'utf8'),
    /data-entry-slug="september-15-stocking-update"/
  );
  assert.match(fs.readFileSync(path.join(fixtureRoot, 'index.html'), 'utf8'), /new latest entry/);
  assert.match(
    fs.readFileSync(path.join(fixtureRoot, 'tank', 'index.html'), 'utf8'),
    /5 Thai micro spider crabs/
  );

  publishScheduledEntry(fixtureRoot, '2026-09-16');
  const journal = fs.readFileSync(path.join(fixtureRoot, 'journal', 'index.html'), 'utf8');
  assert.strictEqual(
    (journal.match(/data-entry-slug="september-15-stocking-update"/g) || []).length,
    1,
    'publishing must be idempotent'
  );
  const tank = fs.readFileSync(path.join(fixtureRoot, 'tank', 'index.html'), 'utf8');
  assert.strictEqual(
    (tank.match(/5 Thai micro spider crabs/g) || []).length,
    1,
    'stocking update must be idempotent'
  );

  console.log('Scheduled-entry publication tests passed.');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
