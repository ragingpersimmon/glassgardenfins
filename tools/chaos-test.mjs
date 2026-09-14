import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const pages = [
  'index.html',
  path.join('tank', 'index.html'),
  path.join('journal', 'index.html')
];

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function scoreCoreUsability(html) {
  let score = 0;
  if (/<main\b/i.test(html)) score += 1;
  if (/<header\b/i.test(html)) score += 1;
  if (/<nav\b/i.test(html)) score += 1;
  if (/<h1\b|<h2\b/i.test(html)) score += 1;
  if (/<a\s+[^>]*href=/.test(html)) score += 1;
  if (/<meta\s+name="viewport"/i.test(html)) score += 1;
  return score;
}

function runDeterministicFaultChecks(file, html) {
  const scenarios = [
    {
      name: 'script_load_failure',
      mutate: (v) => v.replace(/<script\s+src="[^"]+"\s*><\/script>/i, ''),
      assert: (v) => /<main\b/i.test(v) && /<nav\b/i.test(v)
    },
    {
      name: 'stylesheet_load_failure',
      mutate: (v) => v.replace(/<link\s+rel="stylesheet"[^>]*>/i, ''),
      assert: (v) => /<header\b/i.test(v) && /<main\b/i.test(v)
    },
    {
      name: 'font_load_failure',
      mutate: (v) => v.replace(/<link\s+href="https:\/\/fonts\.googleapis\.com[^>]*>/gi, ''),
      assert: (v) => /<title>[^<]+<\/title>/i.test(v) && /<main\b/i.test(v)
    },
    {
      name: 'animation_removed',
      mutate: (v) => v.replace(/prefers-reduced-motion/g, 'reduced-motion-chaos-check'),
      assert: (v) => /<main\b/i.test(v)
    }
  ];

  for (const scenario of scenarios) {
    const mutated = scenario.mutate(html);
    const score = scoreCoreUsability(mutated);
    check(score >= 5, `${file}: ${scenario.name} dropped core usability score below threshold (${score}/6)`);
    check(scenario.assert(mutated), `${file}: ${scenario.name} failed resilience assertion`);
  }
}

function runHeuristicChecks(file, html) {
  const anchors = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const uniqueAnchors = new Set(anchors);
  check(uniqueAnchors.size >= 2, `${file}: heuristic nav diversity too low`);

  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  const avgLength = paragraphs.length
    ? paragraphs.reduce((sum, text) => sum + text.length, 0) / paragraphs.length
    : 0;
  check(avgLength >= 30, `${file}: heuristic content density too low`);

  const headingDepth = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const hasJump = headingDepth.some((value, idx) => idx > 0 && value - headingDepth[idx - 1] > 1);
  check(!hasJump, `${file}: heuristic heading hierarchy jump detected`);
}

for (const page of pages) {
  const html = read(page);
  runDeterministicFaultChecks(page, html);
  runHeuristicChecks(page, html);
}

if (failures.length) {
  console.error('Chaos checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Chaos checks passed (deterministic + heuristic).');
