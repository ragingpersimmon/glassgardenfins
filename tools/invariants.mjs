import fs from 'node:fs';
import path from 'node:path';

export const SITE_ORIGIN = 'https://littlefinswim.net';

export const PAGE_DEFS = [
  { file: 'index.html', route: '/', current: null },
  { file: 'tank/index.html', route: '/tank/', current: '/tank/' },
  { file: 'journal/index.html', route: '/journal/', current: '/journal/' },
  {
    file: 'journal/10-aquarium-questions/index.html',
    route: '/journal/10-aquarium-questions/',
    current: '/journal/'
  },
  {
    file: 'journal/first-residents-amano-shrimp/index.html',
    route: '/journal/first-residents-amano-shrimp/',
    current: '/journal/'
  },
  {
    file: 'journal/detritus-worms/index.html',
    route: '/journal/detritus-worms/',
    current: '/journal/'
  },
  {
    file: 'journal/dialing-in-before-stocking/index.html',
    route: '/journal/dialing-in-before-stocking/',
    current: '/journal/'
  }
];

function firstMatch(source, regex) {
  const match = source.match(regex);
  return match ? match[1] : null;
}

function has(source, regex) {
  return regex.test(source);
}

export function checkPage(html, { route, current }) {
  const errors = [];
  const expectedCanonical = `${SITE_ORIGIN}${route === '/' ? '/' : route}`;

  const title = firstMatch(html, /<title>([^<]+)<\/title>/i);
  if (!title) errors.push('missing <title>');

  const canonical = firstMatch(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*>/i
  );
  if (!canonical) {
    errors.push('missing canonical url');
  } else if (canonical !== expectedCanonical) {
    errors.push(`canonical mismatch: expected ${expectedCanonical}, got ${canonical}`);
  }

  const ogUrl = firstMatch(
    html,
    /<meta\s+property="og:url"\s+content="([^"]+)"\s*>/i
  );
  if (!ogUrl) {
    errors.push('missing og:url');
  } else if (canonical && ogUrl !== canonical) {
    errors.push(`og:url mismatch: expected ${canonical}, got ${ogUrl}`);
  }

  const twitterUrl = firstMatch(
    html,
    /<meta\s+name="twitter:url"\s+content="([^"]+)"\s*>/i
  );
  if (!twitterUrl) {
    errors.push('missing twitter:url');
  } else if (canonical && twitterUrl !== canonical) {
    errors.push(`twitter:url mismatch: expected ${canonical}, got ${twitterUrl}`);
  }

  if (!has(html, /<main[^>]*\sid="top"[^>]*>/i)) {
    errors.push('missing #top main landmark');
  }

  if (!has(html, /<script\s+src="\/script\.js"><\/script>/i)) {
    errors.push('missing /script.js include');
  }

  if (!has(html, /href="\/tank\/"/i) || !has(html, /href="\/journal\/"/i)) {
    errors.push('missing primary nav links');
  }

  const tankCurrent = has(html, /<a\s+href="\/tank\/"[^>]*aria-current="page"/i);
  const journalCurrent = has(html, /<a\s+href="\/journal\/"[^>]*aria-current="page"/i);

  if (current === '/tank/') {
    if (!tankCurrent) errors.push('tank page missing aria-current');
    if (journalCurrent) errors.push('journal nav should not be current on tank page');
  } else if (current === '/journal/') {
    if (!journalCurrent) errors.push('journal page missing aria-current');
    if (tankCurrent) errors.push('tank nav should not be current on journal page');
  } else {
    if (tankCurrent || journalCurrent) errors.push('home page should not set aria-current on subpage links');
  }

  const csp = firstMatch(
    html,
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*>/i
  );
  if (!csp) {
    errors.push('missing Content-Security-Policy meta tag');
  } else {
    if (!csp.includes("default-src 'self'")) errors.push('CSP missing default-src self');
    if (!csp.includes("script-src 'self'")) errors.push('CSP missing script-src self');
    if (!/style-src[^;]*https:\/\/fonts\.googleapis\.com(?=\s|;|$)/i.test(csp)) {
      errors.push('CSP missing Google Fonts stylesheet source');
    }
    if (!/font-src[^;]*https:\/\/fonts\.gstatic\.com(?=\s|;|$)/i.test(csp)) {
      errors.push('CSP missing Google Fonts font source');
    }
  }

  return errors;
}

export function readProjectPage(repoRoot, file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}
