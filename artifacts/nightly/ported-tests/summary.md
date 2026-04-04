# Nightly Suite: ported-tests

- Status: success
- Duration: 17.0s
- Command: `pnpm exec vitest run tests/ported --reporter=default --reporter=junit --outputFile=artifacts/nightly/ported-tests/junit.xml`
- Primary log: `artifacts/nightly/ported-tests/output.log`

## Artifacts

- summary: `artifacts/nightly/ported-tests/summary.md`
- status: `artifacts/nightly/ported-tests/status.json`
- log: `artifacts/nightly/ported-tests/output.log`
- junit: `artifacts/nightly/ported-tests/junit.xml`
