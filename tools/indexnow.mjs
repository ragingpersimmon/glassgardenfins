import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG, SITE_ORIGIN } from './site-config.mjs';

// IndexNow notifies Bing, Yandex, Seznam, Naver, and other participating search
// engines about changed URLs right after a deploy. `plan` runs before deploying
// and compares the live sitemap with the freshly built one; `submit` runs after
// the deploy, waits for the key file to go live, and posts the changed URLs.
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const REQUEST_TIMEOUT_MS = 20000;

export function sitemapLastmods(xml) {
  return new Map(Array.from(
    xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g),
    (match) => [match[1].trim(), match[2]?.trim() ?? '']
  ));
}

// New, re-dated, and removed URLs; removed pages are submitted so engines
// recrawl them and drop them from the index.
export function changedUrls(liveXml, builtXml) {
  const live = sitemapLastmods(liveXml);
  const built = sitemapLastmods(builtXml);
  const changed = [...built].filter(([url, lastmod]) => live.get(url) !== lastmod).map(([url]) => url);
  const removed = [...live.keys()].filter((url) => !built.has(url));
  return [...changed, ...removed];
}

export function indexNowPayload(urls, { key = SITE_CONFIG.indexNowKey, origin = SITE_ORIGIN } = {}) {
  if (!key) return null;
  if (!KEY_PATTERN.test(key)) {
    throw new Error('site-config.json indexNowKey must be 8-128 letters, digits, or dashes.');
  }
  const { host } = new URL(origin);
  const urlList = [...new Set(urls)].filter((url) => new URL(url).host === host);
  if (!urlList.length) return null;
  return { host, key, keyLocation: `${origin}/${key}.txt`, urlList };
}

async function fetchText(url) {
  const busted = new URL(url);
  busted.searchParams.set('indexnow', String(Date.now()));
  const response = await fetch(busted, {
    cache: 'no-store',
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  return { status: response.status, text: response.ok ? await response.text() : '' };
}

function writeOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

export async function plan(builtSitemapPath) {
  const built = fs.readFileSync(builtSitemapPath, 'utf8');
  let payload = null;
  try {
    const live = await fetchText(`${SITE_ORIGIN}/sitemap.xml`);
    if (live.status !== 200) throw new Error(`live sitemap returned HTTP ${live.status}`);
    payload = indexNowPayload(changedUrls(live.text, built));
  } catch (error) {
    console.log(`::warning::IndexNow plan skipped: ${error.message}`);
  }
  writeOutput('payload', payload ? JSON.stringify(payload) : '');
  console.log(payload
    ? `IndexNow will submit ${payload.urlList.length} URL(s):\n  ${payload.urlList.join('\n  ')}`
    : 'IndexNow: no changed URLs to submit.');
  return payload;
}

export async function submit(rawPayload, { attempts = 10, delayMs = 30000 } = {}) {
  const payload = JSON.parse(rawPayload);
  if (!payload || !KEY_PATTERN.test(payload.key ?? '') || !Array.isArray(payload.urlList) || !payload.urlList.length) {
    throw new Error('IndexNow payload is malformed.');
  }
  // The key file must be live before engines can verify the submission.
  for (let attempt = 1; ; attempt += 1) {
    const keyFile = await fetchText(payload.keyLocation).catch((error) => ({ status: 0, text: '', error }));
    if (keyFile.status === 200 && keyFile.text.trim() === payload.key) break;
    if (attempt >= attempts) {
      throw new Error(`IndexNow key file is not live at ${payload.keyLocation} (HTTP ${keyFile.status}).`);
    }
    console.log(`Waiting for ${payload.keyLocation} (attempt ${attempt}/${attempts}, HTTP ${keyFile.status})...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  const detail = (await response.text().catch(() => '')).trim().slice(0, 500);
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the submission: HTTP ${response.status}${detail ? ` ${detail}` : ''}`);
  }
  console.log(`IndexNow accepted ${payload.urlList.length} URL(s) (HTTP ${response.status}).`);
  return response.status;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [command, argument] = process.argv.slice(2);
  try {
    if (command === 'plan') {
      await plan(path.resolve(argument || path.join('_site', 'sitemap.xml')));
    } else if (command === 'submit') {
      const rawPayload = argument || process.env.INDEXNOW_PAYLOAD || '';
      if (!rawPayload) {
        console.log('IndexNow: nothing to submit.');
      } else {
        await submit(rawPayload);
      }
    } else {
      console.error('Usage: node tools/indexnow.mjs plan [built-sitemap.xml] | submit [payload-json]');
      process.exitCode = 2;
    }
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
