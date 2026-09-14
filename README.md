# littlefinswim

Static site for Little Fin Swim, with deterministic and chaos-style browser backtests.

## Local validation

```bash
npm install
npm run test:setup
npm test
```

## Test suites

- `npm run test:deterministic`: deterministic checks for page metadata, canonical URLs, nav presence, and reduced-motion/runtime fallbacks.
- `npm run test:chaos`: seeded (`1337`) heuristic/chaos run across random routes, viewports, reduced-motion modes, and resource fault injection (font blocking, script delay/block).

## CI

GitHub Actions runs both suites on each push and pull request.
