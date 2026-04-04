# Dependency Policy

This document defines the dependency and license gate for `svelte-streamdown` under `PLAN.md` issue `P1-05`.

Its purpose is to make dependency risk and license drift reviewable before release, instead of discovering them ad hoc during publish.

## Scope

- Enforcement script: `scripts/verify-dependency-policy.mjs`
- Machine-readable policy: `config/dependency-policy.json`
- CI entrypoint: `pnpm verify:dependency-policy`
- Current license inventory scope: production dependency graph (`pnpm licenses list --json --prod`)
- Current security audit scopes:
  - production dependency graph (`pnpm audit --json --prod`)
  - development dependency graph (`pnpm audit --json --dev`)

## Gate Rules

The dependency gate is release-blocking.

The gate fails when any of the following is true:

- a production advisory at or above the configured threshold is not explicitly approved in `config/dependency-policy.json`
- a development advisory at or above the configured threshold is not explicitly approved in `config/dependency-policy.json`
- a production package reports a license that is neither allowlisted nor explicitly approved in `config/dependency-policy.json`
- the policy file itself is malformed or incomplete

The gate does not silently ignore baseline risk. Existing exceptions remain visible in the JSON report and must be reviewed deliberately.

## Severity Threshold Policy

Current thresholds:

- `prod` audit threshold: `high`
- `dev` audit threshold: `high`

Rationale:

- `high` and `critical` advisories are severe enough to block trusted release readiness by default.
- `moderate`, `low`, and `info` advisories are still inventoried by `pnpm audit`, but they do not fail the current gate unless the threshold is tightened in a reviewed PR.
- production and development graphs are evaluated separately so the repository can distinguish shipped-package risk from tooling-chain risk without flattening them into one opaque report.

## License Policy

Current production allowlist:

- `MIT`
- `ISC`
- `Apache-2.0`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `(MPL-2.0 OR Apache-2.0)`
- `Unlicense`

Any other production license string is treated as release-blocking unless there is a reviewed package exception in `config/dependency-policy.json`.

`Unknown` is not implicitly acceptable. It must either be resolved upstream or documented with concrete evidence in the exception list.

## Exception Handling

Exceptions are stored only in `config/dependency-policy.json`.

Every exception must include:

- the exact advisory ID or package name plus license string
- a concrete reason for acceptance
- a review deadline or removal trigger
- for license exceptions, a repo-hosted evidence path showing why the missing SPDX metadata is acceptable

Rules for adding an exception:

1. Prefer upgrading or removing the dependency first.
2. If that is out of scope, add the narrowest possible exception in `config/dependency-policy.json`.
3. Record the reason and removal trigger in the same PR as the exception.
4. Do not approve wildcard exceptions or severity-wide suppressions.

Rules for removing an exception:

1. Upgrade the dependency or correct the metadata.
2. Re-run `pnpm verify:dependency-policy`.
3. Delete the obsolete exception entry in the same change.

## Current Approved Exceptions

Current baseline approvals are intentionally explicit:

- one production `high` advisory on `lodash-es`, inherited transitively through `mermaid`; this is still a trusted-release blocker until the production graph upgrades past `lodash-es < 4.18.0`
- repository-baseline development `high` advisories in the current SvelteKit, Vite, Playwright, Wrangler, and Vitest tooling graph; these remain reviewed debt, but they are not first-release blockers by themselves because they do not ship in the published package
- one production license metadata exception for `khroma`, whose npm tarball ships MIT license text even though the published package metadata still reports `Unknown`

The prior package-specific `entities` exception has been removed. `BSD-2-Clause` is now allowlisted at the policy level for production dependencies.

The presence of an approval does not mean the issue is harmless. It means the issue is known, reviewable, and prevented from disappearing into CI noise until the dependency graph is upgraded.

## Production Exception Decisions

Reviewed on `2026-04-04` for `ASE-40`.

| Item | Decision | Release impact | Evidence | Removal trigger |
| --- | --- | --- | --- | --- |
| `lodash-es` advisory `1115805` via `mermaid@11.11.0` | Keep the advisory exception visible in `config/dependency-policy.json`. | Still blocks the first trusted release. | `config/dependency-policy.json`; `artifacts/nightly/dependency-audit/dependency-policy.json`; `artifacts/nightly/dependency-audit/reviewed-production-exceptions.md` | Remove before the first trusted release by upgrading the `mermaid` / `lodash-es` chain. |
| `entities@6.0.1` `BSD-2-Clause` | Remove the package-specific exception and allowlist `BSD-2-Clause` for production dependencies. | No longer blocks the first trusted release. | `config/dependency-policy.json`; `artifacts/nightly/dependency-audit/reviewed-production-exceptions.md` | Re-review only if the repository tightens the production allowlist or the graph introduces a materially different license concern. |
| `khroma@2.1.0` `Unknown` license metadata | Keep a package-specific metadata exception because the reviewed npm tarball ships MIT license text while package metadata still omits SPDX. | Does not block the first trusted release while `khroma@2.1.0` remains the reviewed package. | `config/dependency-policy.json`; `artifacts/nightly/dependency-audit/reviewed-production-exceptions.md#khroma-2-1-0-license-metadata` | Remove when `khroma` publishes SPDX metadata or leaves the production graph. |

## Validation Commands

- `pnpm verify:dependency-policy`
- `pnpm audit --json --prod`
- `pnpm audit --json --dev`
- `pnpm licenses list --json --prod`

Reviewers should reject the release gate if they cannot trace any reported exception back to a concrete entry in `config/dependency-policy.json`.
