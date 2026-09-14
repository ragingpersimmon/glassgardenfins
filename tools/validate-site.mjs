import path from 'node:path';
import { PAGE_DEFS, checkPage, readProjectPage } from './invariants.mjs';

const repoRoot = process.cwd();
let failures = 0;

for (const page of PAGE_DEFS) {
  const html = readProjectPage(repoRoot, page.file);
  const errors = checkPage(html, page);
  if (errors.length) {
    failures += errors.length;
    console.error(`\n❌ ${page.file}`);
    for (const err of errors) console.error(`  - ${err}`);
  } else {
    console.log(`✅ ${page.file}`);
  }
}

if (failures > 0) {
  console.error(`\nValidation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nAll deterministic checks passed.');
