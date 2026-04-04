# Reviewed Production Exceptions

Reviewed for `ASE-40` on `2026-04-04`.

Inputs used in this review:

- `pnpm verify:dependency-policy`
- `pnpm licenses list --json --prod`
- `npm pack khroma@2.1.0 --pack-destination <tempdir>`

## Decision Summary

| Item | Current finding | Decision | Trusted-release impact | Removal trigger |
| --- | --- | --- | --- | --- |
| `lodash-es` advisory `1115805` via `mermaid@11.11.0` | `pnpm verify:dependency-policy` reports one approved production `high` advisory on `lodash-es@4.17.21`, with the vulnerable path `.>mermaid>lodash-es`. | Keep the advisory exception visible in the policy output so the risk cannot disappear into CI noise. | Still blocks the first trusted release until the production graph no longer resolves `lodash-es < 4.18.0`. | Upgrade `mermaid` or otherwise eliminate the vulnerable `lodash-es` resolution. |
| `entities@6.0.1` license | `pnpm licenses list --json --prod` reports `BSD-2-Clause` for `entities`. | Remove the package-specific exception and allowlist `BSD-2-Clause` at the policy level. This is a permissive production license and no longer needs an ad hoc waiver. | Does not block the first trusted release. | Re-review only if the production graph adds a materially different license concern or the repository tightens its allowlist. |
| `khroma@2.1.0` license metadata | `pnpm licenses list --json --prod` reports `Unknown`, but the reviewed npm tarball contains `package/license` with MIT text while `package/package.json` still omits SPDX metadata. | Keep a package-specific metadata exception and treat the bundled MIT license text as the operative evidence until upstream publishes SPDX metadata. | Does not block the first trusted release while the reviewed version stays at `2.1.0`. | Remove the exception once `khroma` publishes SPDX metadata or the dependency is removed. |

## khroma 2.1.0 License Metadata

Observed during the `2026-04-04` review:

- `npm pack khroma@2.1.0` produced a tarball containing `package/license`.
- Extracting `package/package.json` showed `"license": null`.
- Extracting `package/license` showed the MIT license text beginning with `The MIT License (MIT)`.

This is sufficient evidence to treat the current `Unknown` inventory result as a metadata defect rather than an unknown legal review state.
