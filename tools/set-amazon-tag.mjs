import fs from 'node:fs';
import path from 'node:path';
import { enrichSite } from './enrich-metadata.mjs';

const argument = process.argv[2];
if (!argument) {
  throw new Error('Usage: node tools/set-amazon-tag.mjs <associates-tag|--clear>');
}

const tag = argument === '--clear' ? '' : argument.trim();
if (tag && !/^[a-z0-9-]{1,64}$/i.test(tag)) {
  throw new Error('Amazon Associates tag must match [a-z0-9-]{1,64}.');
}

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, 'site-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const previousTag = config.amazonAssociateTag || '';
config.amazonAssociateTag = tag;
const temporaryConfigPath = `${configPath}.tmp`;
fs.writeFileSync(temporaryConfigPath, `${JSON.stringify(config, null, 2)}\n`);
fs.renameSync(temporaryConfigPath, configPath);
try {
  enrichSite(repoRoot);
} catch (error) {
  config.amazonAssociateTag = previousTag;
  fs.writeFileSync(temporaryConfigPath, `${JSON.stringify(config, null, 2)}\n`);
  fs.renameSync(temporaryConfigPath, configPath);
  enrichSite(repoRoot);
  throw error;
}
console.log(tag ? 'Configured Amazon Associates tag on product pages.' : 'Cleared Amazon Associates tag.');
