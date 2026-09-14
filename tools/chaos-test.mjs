import { PAGE_DEFS, checkPage, readProjectPage } from './invariants.mjs';

const repoRoot = process.cwd();
const basePages = PAGE_DEFS.map((page) => ({ ...page, html: readProjectPage(repoRoot, page.file) }));

const deterministicFaults = [
  {
    name: 'remove canonical',
    mutate: (html) => html.replace(/<link\s+rel="canonical"[^>]*>\n?/i, ''),
    expect: /canonical/
  },
  {
    name: 'mismatch og:url',
    mutate: (html) => html.replace(/(<meta\s+property="og:url"\s+content=")[^"]+("\s*>)/i, '$1https://example.invalid/$2'),
    expect: /og:url mismatch/
  },
  {
    name: 'remove script include',
    mutate: (html) => html.replace(/<script\s+src="\/script\.js"><\/script>\n?/i, ''),
    expect: /script\.js/
  },
  {
    name: 'remove CSP',
    mutate: (html) => html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>\n?/i, ''),
    expect: /Content-Security-Policy/
  }
];

function lcg(seed) {
  let state = seed >>> 0;
  return function rand() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const heuristicMutators = [
  {
    mutate: (html) => html.replace(/<main\s+id="top">/i, '<main>'),
    expect: /main landmark/
  },
  {
    mutate: (html) => html.replace(/<meta\s+name="twitter:url"[^>]*>/i, ''),
    expect: /twitter:url/
  },
  {
    mutate: (html) => html.replace(/script-src 'self'/i, "script-src 'none'"),
    expect: /script-src self/
  },
  {
    mutate: (html) => html.replace(/<script\s+src="\/script\.js"><\/script>\n?/i, ''),
    expect: /script\.js/
  },
  {
    mutate: (html) => html.replace(/href="\/tank\/"/gi, 'href="/tank"'),
    expect: /primary nav links/
  },
  {
    mutate: (html) => html.replace(/href="\/journal\/"/gi, 'href="/journal"'),
    expect: /primary nav links/
  }
];

let failures = 0;

for (const page of basePages) {
  for (const fault of deterministicFaults) {
    const mutated = fault.mutate(page.html);
    const errors = checkPage(mutated, page);
    if (!errors.some((e) => fault.expect.test(e))) {
      failures += 1;
      console.error(`❌ deterministic fault not detected: ${page.file} / ${fault.name}`);
    }
  }
}

const rand = lcg(20260914);
const trials = 30;
for (let i = 0; i < trials; i += 1) {
  const page = basePages[Math.floor(rand() * basePages.length)];
  const choice = heuristicMutators[Math.floor(rand() * heuristicMutators.length)];
  const mutated = choice.mutate(page.html);
  const errors = checkPage(mutated, page);
  if (!errors.some((e) => choice.expect.test(e))) {
    failures += 1;
    console.error(`❌ heuristic mutation escaped detection at trial ${i + 1} on ${page.file}`);
  }
}

if (failures > 0) {
  console.error(`\nChaos tests failed with ${failures} missed fault(s).`);
  process.exit(1);
}

console.log(`✅ Chaos tests passed (${deterministicFaults.length * basePages.length} deterministic + ${trials} heuristic).`);
