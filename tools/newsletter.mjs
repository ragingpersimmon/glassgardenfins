// The optional inline newsletter signup. It renders only when site-config.json
// has a newsletter.formAction, and only on pages where a signup makes sense.
export const NEWSLETTER_EXCLUDED_FILES = new Set(['404.html', 'privacy/index.html']);

const FIELD_NAME = /^[A-Za-z0-9_.[\]-]{1,64}$/;

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Returns null when no newsletter is configured, otherwise normalized settings.
// Throws on a malformed configuration so a bad value never reaches a page.
export function newsletterSettings(config) {
  const newsletter = config?.newsletter ?? {};
  const formAction = String(newsletter.formAction ?? '').trim();
  if (!formAction) return null;

  let url;
  try {
    url = new URL(formAction);
  } catch {
    throw new Error('site-config.json newsletter.formAction must be an absolute https URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('site-config.json newsletter.formAction must be an https URL without credentials or a fragment.');
  }

  const emailField = String(newsletter.emailField || 'email');
  if (!FIELD_NAME.test(emailField)) {
    throw new Error('site-config.json newsletter.emailField must match [A-Za-z0-9_.[\\]-]{1,64}.');
  }

  const hiddenFields = Object.entries(newsletter.hiddenFields ?? {}).map(([name, value]) => {
    if (!FIELD_NAME.test(name) || name === emailField || String(value).length > 200) {
      throw new Error(`site-config.json newsletter.hiddenFields has an invalid entry: ${name}`);
    }
    return [name, String(value)];
  });

  const provider = String(newsletter.provider || url.hostname).trim();
  if (!provider || provider.length > 64 || /[<>"]/.test(provider)) {
    throw new Error('site-config.json newsletter.provider must be a short plain-text name.');
  }

  return { provider, formAction: url.href, origin: url.origin, emailField, hiddenFields };
}

export function newsletterApplies(file) {
  return !NEWSLETTER_EXCLUDED_FILES.has(file.replaceAll('\\', '/'));
}

export function newsletterMarkup(settings) {
  const hiddenInputs = settings.hiddenFields
    .map(([name, value]) => `\n      <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('');
  return `<aside class="newsletter" aria-labelledby="newsletter-title" data-newsletter>
  <div class="wrap newsletter__inner">
    <div class="newsletter__copy">
      <h2 id="newsletter-title" class="newsletter__title">Tank notes by email</h2>
      <p class="newsletter__lead">New journal entries and guides when they are published, plus occasional gear picks that may include affiliate links. Sent by Glass Garden Fins; unsubscribe anytime. Details are in the <a href="/privacy/">privacy notice</a>.</p>
    </div>
    <form class="newsletter__form" action="${escapeHtml(settings.formAction)}" method="post">
      <label class="newsletter__label" for="newsletter-email">Email address</label>
      <div class="newsletter__controls">
        <input class="newsletter__input" id="newsletter-email" name="${escapeHtml(settings.emailField)}" type="email" autocomplete="email" required>
        <button class="newsletter__button" type="submit">Subscribe</button>
      </div>${hiddenInputs}
    </form>
  </div>
</aside>`;
}

export function newsletterPrivacyStatus(settings) {
  return settings
    ? `The optional email newsletter is delivered by ${escapeHtml(settings.provider)}. If you subscribe, the email address you enter is sent to ${escapeHtml(settings.provider)} and stored there only to send Glass Garden Fins journal updates and occasional product recommendations. Every email includes an unsubscribe link, and you can withdraw consent at any time.`
    : 'Glass Garden Fins does not currently offer an email newsletter, and no page on this site asks for an email address.';
}
