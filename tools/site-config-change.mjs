import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DATES_FILE } from './content-dates.mjs';
import { enrichSite } from './enrich-metadata.mjs';
import { generateFeed } from './generate-feed.mjs';
import { generateSitemap } from './generate-sitemap.mjs';

function writeAtomically(file, text) {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, text);
  fs.renameSync(temporary, file);
}

// Regenerates every output that depends on site-config.json.
export function rebuildConfiguredOutputs(repoRoot) {
  enrichSite(repoRoot);
  generateFeed(repoRoot);
  generateSitemap(repoRoot);
}

// Applies mutate(config) to site-config.json and rebuilds the site. If the
// rebuild fails, the previous config and content-date record are restored and
// the site is rebuilt from them before the error is rethrown.
export function applySiteConfigChange(repoRoot, mutate) {
  const configPath = path.join(repoRoot, 'site-config.json');
  const datesPath = path.join(repoRoot, CONTENT_DATES_FILE);
  const previousConfig = fs.readFileSync(configPath, 'utf8');
  const previousDates = fs.existsSync(datesPath) ? fs.readFileSync(datesPath, 'utf8') : null;
  const config = JSON.parse(previousConfig);
  mutate(config);
  writeAtomically(configPath, `${JSON.stringify(config, null, 2)}\n`);
  try {
    rebuildConfiguredOutputs(repoRoot);
  } catch (error) {
    writeAtomically(configPath, previousConfig);
    if (previousDates === null) fs.rmSync(datesPath, { force: true });
    else writeAtomically(datesPath, previousDates);
    rebuildConfiguredOutputs(repoRoot);
    throw error;
  }
  return config;
}
