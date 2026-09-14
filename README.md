# littlefinswim

Static site for Little Fin Swim.

## Robustness checks

This repository includes deterministic validation plus heuristic and browser-level chaos tests.

### Deterministic validation

```bash
npm run validate:deterministic
```

Checks:
- Canonical/OG/Twitter URL consistency with `CNAME`
- Required metadata and semantic structure
- Landmark/heading continuity and duplicate ID detection
- Internal link and asset existence
- Navigation `aria-current` correctness
- Reduced-motion and `IntersectionObserver` fallback presence

### Chaos checks

```bash
npm run test:chaos
```

Includes:
- `npm run test:chaos:heuristic` (static deterministic + heuristic resilience checks)
- `npm run test:chaos:browser` (Playwright fault-injection tests)

Browser chaos scenarios:
- Script load failure
- Stylesheet load failure
- Font load failure under throttled requests
- Reduced-motion environment
- `IntersectionObserver` unavailable
- 404 behavior

### Full local verification

```bash
npm test
```

CI runs deterministic and both chaos suites via `.github/workflows/robustness.yml`.
