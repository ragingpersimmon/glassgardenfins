import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const pages = [
  { file: 'index.html', expectedPath: '/', expectedCurrent: null },
  { file: path.join('tank', 'index.html'), expectedPath: '/tank/', expectedCurrent: '/tank/' },
  { file: path.join('journal', 'index.html'), expectedPath: '/journal/', expectedCurrent: '/journal/' }
];

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function extractAttribute(html, regex, label, file) {
  const match = html.match(regex);
  check(Boolean(match?.[1]), `${file}: missing ${label}`);
  return match?.[1] ?? '';
}

function fileExistsForRootPath(sitePath) {
  if (!sitePath.startsWith('/')) return false;
  const normalized = sitePath.replace(/^\//, '');
  return fs.existsSync(path.join(repoRoot, normalized));
}

function checkHeadingContinuity(html, file) {
  const headingDepth = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  check(headingDepth.length > 0, `${file}: expected at least one heading`);
  const hasJump = headingDepth.some((value, idx) => idx > 0 && value - headingDepth[idx - 1] > 1);
  check(!hasJump, `${file}: heading hierarchy jumps more than one level`);
}

function checkUniqueIds(html, file) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((m) => m[1]);
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  check(duplicates.length === 0, `${file}: duplicate id attributes found (${[...new Set(duplicates)].join(', ')})`);
}

function checkLandmarks(html, file) {
  check(/<header\b/i.test(html), `${file}: missing <header>`);
  check(/<main\b/i.test(html), `${file}: missing <main>`);
  check(/<footer\b/i.test(html), `${file}: missing <footer>`);
  check(/<nav\b/i.test(html), `${file}: missing <nav>`);
}

function checkLinks(html, file) {
  const links = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  }));

  check(links.length >= 2, `${file}: expected at least two links`);

  for (const link of links) {
    check(link.text.length > 0, `${file}: link with href ${link.href} has no text`);
  }

  const internalLinks = links.map((link) => link.href).filter((href) => href.startsWith('/'));

  for (const href of internalLinks) {
    const localTarget = href.endsWith('/') ? `${href}index.html` : href;
    const fsTarget = path.join(repoRoot, localTarget.replace(/^\//, ''));
    check(fs.existsSync(fsTarget), `${file}: broken internal link ${href}`);
  }
}

function checkNavigationCurrent(html, file, expectedCurrent) {
  const currentLinks = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*aria-current="page"/gi)].map((m) => m[1]);

  if (!expectedCurrent) {
    check(currentLinks.length <= 1, `${file}: expected at most one aria-current page link`);
    return;
  }

  check(currentLinks.length === 1, `${file}: expected exactly one aria-current page link`);
  check(currentLinks[0] === expectedCurrent, `${file}: aria-current link should be ${expectedCurrent}`);
}

const cname = read('CNAME').trim();
check(Boolean(cname), 'CNAME: expected non-empty domain');

for (const page of pages) {
  const html = read(page.file);
  check(/<!DOCTYPE html>/i.test(html), `${page.file}: missing doctype`);
  check(/<html[^>]*\blang="en"/i.test(html), `${page.file}: expected <html lang="en">`);
  check(/<meta\s+charset="UTF-8"\s*\/?>/i.test(html), `${page.file}: missing UTF-8 charset`);
  check(/<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1.0"\s*\/?>/i.test(html), `${page.file}: missing or invalid viewport tag`);
  check(/<title>[^<]+<\/title>/i.test(html), `${page.file}: missing <title>`);
  check(/<meta\s+name="description"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing meta description`);
  check(/<meta\s+property="og:title"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing og:title`);
  check(/<meta\s+property="og:description"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing og:description`);
  check(/<meta\s+name="twitter:title"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing twitter:title`);
  check(/<meta\s+name="twitter:description"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing twitter:description`);

  const canonical = extractAttribute(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i,
    'canonical URL',
    page.file
  );

  const ogUrl = extractAttribute(
    html,
    /<meta\s+property="og:url"\s+content="([^"]+)"\s*\/?>/i,
    'og:url',
    page.file
  );

  const twitterUrl = extractAttribute(
    html,
    /<meta\s+name="twitter:url"\s+content="([^"]+)"\s*\/?>/i,
    'twitter:url',
    page.file
  );

  check(canonical === `https://${cname}${page.expectedPath}`, `${page.file}: canonical should be https://${cname}${page.expectedPath}`);
  check(ogUrl === canonical, `${page.file}: og:url should match canonical`);
  check(twitterUrl === canonical, `${page.file}: twitter:url should match canonical`);

  const styleHref = extractAttribute(
    html,
    /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/i,
    'stylesheet href',
    page.file
  );
  check(styleHref === '/style.css', `${page.file}: stylesheet href should be /style.css`);
  check(fileExistsForRootPath(styleHref), `${page.file}: stylesheet file not found for ${styleHref}`);

  const scriptSrc = extractAttribute(
    html,
    /<script\s+src="([^"]+)"\s*><\/script>/i,
    'script src',
    page.file
  );
  check(scriptSrc === '/script.js', `${page.file}: script src should be /script.js`);
  check(fileExistsForRootPath(scriptSrc), `${page.file}: script file not found for ${scriptSrc}`);

  checkLandmarks(html, page.file);
  checkHeadingContinuity(html, page.file);
  checkUniqueIds(html, page.file);
  checkLinks(html, page.file);
  checkNavigationCurrent(html, page.file, page.expectedCurrent);
}

const scriptJs = read('script.js');
check(/prefers-reduced-motion/.test(scriptJs), 'script.js should preserve reduced-motion behavior');
check(/IntersectionObserver/.test(scriptJs), 'script.js should preserve IntersectionObserver fallback');

if (failures.length) {
  console.error('Deterministic validation failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Deterministic validation passed.');
