# Reference Version Freeze

This document freezes the upstream `streamdown` target for parity work in this repository.

## Frozen Upstream

- Upstream repository: `https://github.com/vercel/streamdown.git`
- Frozen commit: `5f6475139a87dee8af08fcf7b01475292bc064d2`
- Frozen branch at capture time: `origin/main`
- Captured from local mirror: `references/streamdown`

## Frozen Package Versions

These versions are taken from the package manifests in the frozen reference commit.

| Package path                  | Package name          | Version |
| ----------------------------- | --------------------- | ------- |
| `packages/streamdown`         | `streamdown`          | `2.5.0` |
| `packages/remend`             | `remend`              | `1.3.0` |
| `packages/streamdown-code`    | `@streamdown/code`    | `1.1.1` |
| `packages/streamdown-math`    | `@streamdown/math`    | `1.0.2` |
| `packages/streamdown-mermaid` | `@streamdown/mermaid` | `1.0.2` |
| `packages/streamdown-cjk`     | `@streamdown/cjk`     | `1.0.3` |

## Parity Scope

Parity targets shipped package behavior, not the full monorepo.

Included in scope:

- `streamdown`
- `remend`
- Official published plugins: `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`, `@streamdown/cjk`
- Public API, parsing behavior, rendering behavior, interaction behavior, and release-facing package outputs for the packages above

Out of scope unless a later plan item explicitly expands scope:

- `references/streamdown/apps/*`
- `references/streamdown/skills/*`
- Monorepo-only tooling, benchmarks, and website implementation details
- Internal implementation details that do not change shipped package behavior

## Decision Rule

All later parity decisions, tests, fixtures, and review arguments must cite this frozen target unless a follow-up issue explicitly updates the freeze.

When a parity discussion needs a source of truth, use this order:

1. This document for the frozen commit and package versions
2. Source, tests, and package metadata from `references/streamdown` at commit `5f6475139a87dee8af08fcf7b01475292bc064d2`
3. The parity contract and matrix documents added in later Phase 0 issues

## Evidence

- Workspace shape: `references/streamdown/pnpm-workspace.yaml`
- Monorepo package list and build targets: `references/streamdown/package.json`
- Core package metadata: `references/streamdown/packages/streamdown/package.json`
- Parser package metadata: `references/streamdown/packages/remend/package.json`
- Plugin package metadata:
  - `references/streamdown/packages/streamdown-code/package.json`
  - `references/streamdown/packages/streamdown-math/package.json`
  - `references/streamdown/packages/streamdown-mermaid/package.json`
  - `references/streamdown/packages/streamdown-cjk/package.json`
