import fs from 'node:fs';
import path from 'node:path';
import { discoverPublicPages } from './generate-sitemap.mjs';
import { SITE_ORIGIN } from './site-config.mjs';

export { SITE_ORIGIN };

export const PAGE_DEFS = discoverPublicPages(process.cwd()).map(({ file, route }) => ({
  file,
  route,
  current: route === '/tank/'
    ? '/tank/'
    : route === '/species/'
      ? '/species/'
      : route === '/gallery/'
        ? '/gallery/'
        : route.startsWith('/journal/')
          ? '/journal/'
          : null
}));

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
  if (!has(html, /<meta\s+name="description"\s+content="[^"]+">/i)) {
    errors.push('missing meta description');
  }
  if (!has(html, /<meta\s+name="theme-color"\s+content="#142C27">/i)) {
    errors.push('missing or invalid theme-color');
  }
  if (!has(html, /<link\s+rel="icon"\s+href="\/favicon\.ico"\s+sizes="any">/i)) {
    errors.push('missing favicon');
  }

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

  const robots = firstMatch(html, /<meta\s+name="robots"\s+content="([^"]+)">/i);
  const expectedRobots = route === '/404.html'
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  if (robots !== expectedRobots) {
    errors.push(`robots directive mismatch: expected ${expectedRobots}`);
  }

  const expectedImage = `${SITE_ORIGIN}/assets/social-card.png`;
  if (!has(html, /<meta\s+property="og:site_name"\s+content="Glass Garden Fins">/i)) {
    errors.push('missing or invalid og:site_name');
  }
  const ogImage = firstMatch(html, /<meta\s+property="og:image"\s+content="([^"]+)">/i);
  if (ogImage !== expectedImage) errors.push('missing or invalid og:image');
  if (!has(html, /<meta\s+property="og:image:width"\s+content="1200">/i)) {
    errors.push('missing og:image width');
  }
  if (!has(html, /<meta\s+property="og:image:height"\s+content="630">/i)) {
    errors.push('missing og:image height');
  }
  const twitterImage = firstMatch(
    html,
    /<meta\s+name="twitter:image"\s+content="([^"]+)">/i
  );
  if (twitterImage !== expectedImage) errors.push('missing or invalid twitter:image');
  if (!has(html, /<meta\s+name="twitter:card"\s+content="summary_large_image">/i)) {
    errors.push('missing summary_large_image Twitter card');
  }

  const schemaSource = firstMatch(
    html,
    /<script\s+type="application\/ld\+json"\s+data-site-schema>([\s\S]*?)<\/script>/i
  );
  if (!schemaSource) {
    errors.push('missing JSON-LD schema');
  } else {
    try {
      const schema = JSON.parse(schemaSource);
      const expectedType = route === '/'
        ? 'WebSite'
        : has(html, /<meta\s+property="og:type"\s+content="article">/i)
          ? 'BlogPosting'
          : 'WebPage';
      if (schema['@type'] !== expectedType) {
        errors.push(`JSON-LD type mismatch: expected ${expectedType}`);
      }
      if (expectedType === 'BlogPosting' && !schema.datePublished) {
        errors.push('BlogPosting schema missing datePublished');
      }
      if (expectedType === 'BlogPosting' && schema.url !== canonical) {
        errors.push('BlogPosting schema URL mismatch');
      }
      if (expectedType === 'BlogPosting' &&
          (!schema.articleSection || !schema.keywords || !schema.about?.length ||
           schema.inLanguage !== 'en-CA')) {
        errors.push('BlogPosting schema missing topic or language metadata');
      }
      const videoSource = firstMatch(
        html,
        /<video\b[^>]*>[\s\S]*?<source[^>]+(?:src|data-src)="([^"]+)"/i
      );
      if (expectedType === 'BlogPosting' && videoSource) {
        const expectedVideoUrl = `${SITE_ORIGIN}${videoSource}`;
        if (schema.video?.['@type'] !== 'VideoObject' ||
            schema.video.contentUrl !== expectedVideoUrl ||
            !schema.video.thumbnailUrl ||
            !schema.video.duration ||
            !schema.video.uploadDate) {
          errors.push('BlogPosting schema missing or invalid VideoObject');
        }
      }
      const cardCount = Array.from(html.matchAll(/class="journal-card__link"/g)).length;
      if (cardCount &&
          (schema.mainEntity?.['@type'] !== 'ItemList' ||
           schema.mainEntity.numberOfItems !== cardCount ||
           schema.mainEntity.itemListElement?.length !== cardCount)) {
        errors.push('journal collection schema does not match rendered entries');
      }
      if (expectedType === 'WebSite' && !schema.alternateName) {
        errors.push('WebSite schema missing alternateName');
      }
    } catch {
      errors.push('invalid JSON-LD schema');
    }
  }

  if (!has(html, /<main[^>]*\sid="top"[^>]*>/i)) {
    errors.push('missing #top main landmark');
  }

  if (!has(html, /<script\s+src="\/script\.js"><\/script>/i)) {
    errors.push('missing /script.js include');
  }
  if (!has(html, /<a\s+href="\/privacy\/">Privacy &amp; disclosure<\/a>/i)) {
    errors.push('missing privacy disclosure link');
  }
  if (has(html, /\bdata-ad-slot\b/i)) {
    errors.push('inactive advertisement space should not be rendered');
  }
  for (const match of html.matchAll(/<script[^>]+\ssrc="([^"]+)"/gi)) {
    if (!match[1].startsWith('/')) errors.push(`external script is not CSP-aligned: ${match[1]}`);
  }
  for (const match of html.matchAll(/<link[^>]+>/gi)) {
    if (!/\brel="(?:stylesheet|preconnect)"/i.test(match[0])) continue;
    const href = match[0].match(/\shref="(https?:\/\/[^"]+)"/i)?.[1];
    if (!href) continue;
    const url = new URL(href);
    if (!['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
      errors.push(`external link origin is not CSP-aligned: ${url.hostname}`);
    }
  }

  if (!has(html, /href="\/tank\/"/i) ||
      !has(html, /href="\/species\/"/i) ||
      !has(html, /href="\/gallery\/"/i) ||
      !has(html, /href="\/journal\/"/i)) {
    errors.push('missing primary nav links');
  }
  if (!has(html, /<footer[\s\S]*href="\/privacy\/"/i)) {
    errors.push('footer missing privacy and disclosure link');
  }

  const tankCurrent = has(html, /<a\s+href="\/tank\/"[^>]*aria-current="page"/i);
  const speciesCurrent = has(html, /<a\s+href="\/species\/"[^>]*aria-current="page"/i);
  const journalCurrent = has(html, /<a\s+href="\/journal\/"[^>]*aria-current="page"/i);
  const galleryCurrent = has(html, /<a\s+href="\/gallery\/"[^>]*aria-current="page"/i);

  if (current === '/tank/') {
    if (!tankCurrent) errors.push('tank page missing aria-current');
    if (speciesCurrent || journalCurrent || galleryCurrent) errors.push('only tank nav should be current on tank page');
  } else if (current === '/species/') {
    if (!speciesCurrent) errors.push('species page missing aria-current');
    if (tankCurrent || journalCurrent || galleryCurrent) errors.push('only species nav should be current on species page');
  } else if (current === '/gallery/') {
    if (!galleryCurrent) errors.push('gallery page missing aria-current');
    if (tankCurrent || speciesCurrent || journalCurrent) errors.push('only gallery nav should be current on gallery page');
  } else if (current === '/journal/') {
    if (!journalCurrent) errors.push('journal page missing aria-current');
    if (tankCurrent || speciesCurrent || galleryCurrent) errors.push('only journal nav should be current on journal page');
  } else {
    if (tankCurrent || speciesCurrent || journalCurrent || galleryCurrent) {
      errors.push('home page should not set aria-current on subpage links');
    }
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
    if (/(?:frame-ancestors|sandbox|report-uri|report-to)\b/i.test(csp)) {
      errors.push('CSP meta claims a directive that is not enforceable from meta');
    }
  }

  const headingLevels = Array.from(html.matchAll(/<h([1-6])\b/gi), (match) => Number(match[1]));
  if (headingLevels[0] !== 1) errors.push('page must begin its heading outline with h1');
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] > headingLevels[index - 1] + 1) {
      errors.push(`heading level skips from h${headingLevels[index - 1]} to h${headingLevels[index]}`);
      break;
    }
  }

  return errors;
}

export function readProjectPage(repoRoot, file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}
