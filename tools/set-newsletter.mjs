import { newsletterSettings } from './newsletter.mjs';
import { applySiteConfigChange } from './site-config-change.mjs';

const USAGE = `Usage:
  node tools/set-newsletter.mjs buttondown <username>
  node tools/set-newsletter.mjs custom <https-form-action> [email-field] [provider-name] [--hidden name=value ...]
  node tools/set-newsletter.mjs --clear

Use "custom" with the form action and email field name from a provider's plain
HTML embed form (Kit, MailerLite, and others). The provider must accept a
standard form POST and keep any redirect on its own origin.`;

function fail(message) {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
}

const [mode, ...rest] = process.argv.slice(2);
const hiddenFields = {};
const positional = [];
for (let index = 0; index < rest.length; index += 1) {
  if (rest[index] === '--hidden') {
    const pair = rest[index + 1] ?? '';
    const separator = pair.indexOf('=');
    if (separator < 1) fail('--hidden expects name=value.');
    hiddenFields[pair.slice(0, separator)] = pair.slice(separator + 1);
    index += 1;
  } else {
    positional.push(rest[index]);
  }
}

let newsletter;
if (mode === '--clear') {
  newsletter = { provider: '', formAction: '', emailField: 'email', hiddenFields: {} };
} else if (mode === 'buttondown') {
  const [username] = positional;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(username ?? '')) fail('Buttondown username must match [A-Za-z0-9_-]{1,64}.');
  newsletter = {
    provider: 'Buttondown',
    formAction: `https://buttondown.com/api/emails/embed-subscribe/${username}`,
    emailField: 'email',
    hiddenFields: { embed: '1' }
  };
} else if (mode === 'custom') {
  const [formAction, emailField = 'email', provider = ''] = positional;
  if (!formAction) fail('custom needs the provider form action URL.');
  newsletter = { provider, formAction, emailField, hiddenFields };
} else {
  fail('Choose buttondown, custom, or --clear.');
}

try {
  newsletterSettings({ newsletter });
} catch (error) {
  fail(error.message);
}

applySiteConfigChange(process.cwd(), (config) => {
  config.newsletter = newsletter;
});
console.log(newsletter.formAction
  ? `Configured the newsletter signup (${newsletterSettings({ newsletter }).provider}). Review /privacy/ and run the validation suite before publishing.`
  : 'Removed the newsletter signup.');
