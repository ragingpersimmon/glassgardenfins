import { applySiteConfigChange } from './site-config-change.mjs';

const argument = process.argv[2];
if (!argument) {
  throw new Error('Usage: node tools/set-amazon-tag.mjs <associates-tag|--clear>');
}

const tag = argument === '--clear' ? '' : argument.trim();
if (tag && !/^[a-z0-9-]{1,64}$/i.test(tag)) {
  throw new Error('Amazon Associates tag must match [a-z0-9-]{1,64}.');
}

applySiteConfigChange(process.cwd(), (config) => {
  config.amazonAssociateTag = tag;
});
console.log(tag ? 'Configured Amazon Associates tag on product pages.' : 'Cleared Amazon Associates tag.');
