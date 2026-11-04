import { CONTENT_DATES_FILE, resolveContentDates, seedContentDatesFromGit } from './content-dates.mjs';
import { discoverPublicPages } from './generate-sitemap.mjs';

// Usage:
//   node tools/update-content-dates.mjs                 refresh changed routes only
//   node tools/update-content-dates.mjs --seed-from-git rebuild every date from history
// Re-seed after changing contentFingerprint(), which otherwise re-dates every page.
const repoRoot = process.cwd();
const pages = discoverPublicPages(repoRoot);

if (process.argv.includes('--seed-from-git')) {
  const record = seedContentDatesFromGit(repoRoot, pages);
  console.log(`Seeded ${CONTENT_DATES_FILE} from git history for ${Object.keys(record).length} routes.`);
} else {
  const dates = resolveContentDates(repoRoot, pages);
  console.log(`Checked ${CONTENT_DATES_FILE} for ${dates.size} routes.`);
}
