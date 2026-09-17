import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_CONFIG = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'site-config.json'), 'utf8')
);

if (!/^https?:\/\/[^/]+$/.test(SITE_CONFIG.siteOrigin || '')) {
  throw new Error('site-config.json siteOrigin must be an HTTP(S) origin without a trailing slash.');
}

export const SITE_ORIGIN = SITE_CONFIG.siteOrigin;
