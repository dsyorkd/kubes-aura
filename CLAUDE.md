## Validation Requirements

**Every task must pass all validation before being declared done. No exceptions.**

Run these checks after all code changes, in this order:

```bash
npx tsc --noEmit                          # TypeScript compiles
npx eslint --max-warnings=0 <changed files>  # Lint clean
pre-commit run --files <changed files>     # Pre-commit hooks pass
npx playwright test --project=chromium     # E2E tests pass (41 expected)
```

Rules:
- Collect ALL errors from a check before fixing. Do not fix-one-run-again in a loop.
- If a new tool (eslint, pre-commit) is being added to a project for the first time, expect existing violations. Run it against all affected files upfront, fix everything in one pass, then verify.
- Do not report "done" until every check above passes clean.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
