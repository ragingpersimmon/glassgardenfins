# littlefinswim

Static site for Little Fin Swim.

## Robustness checks

This repository now includes deterministic and heuristic robustness testing.

### Deterministic validation

```bash
npm run validate:deterministic
```

Checks:
- Canonical/OG/Twitter URL consistency with `CNAME`
- Required metadata and semantic structure
- Internal link and asset existence
- `script.js` and `script.txt` synchronization
- Reduced-motion and IntersectionObserver fallback presence

### Chaos checks (deterministic + heuristic)

```bash
npm run test:chaos
```

Checks:
- Deterministic fault scenarios (script/CSS/font load failure, animation behavior mutation)
- Heuristic resilience signals (navigation diversity, content density, heading continuity)

### Full local verification

```bash
npm test
```

CI runs both checks via `.github/workflows/robustness.yml`.
