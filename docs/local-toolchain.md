# Local Toolchain

This repository pins the development and CI toolchain for `P1-01`.

## Pinned Versions

- Node: `22.22.1`
- pnpm: `10.32.1`

## Source of Truth

- `.nvmrc` pins the Node version used by local `nvm` setups and GitHub Actions.
- `package.json#packageManager` pins the pnpm version used by Corepack-aware environments.
- `package.json#volta` mirrors both versions for Volta users.
- `scripts/verify-toolchain.mjs` proves the runtime versions match the pinned metadata.

## Local Setup

```bash
nvm use
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm verify:toolchain
```

The final command must print the same Node and pnpm versions that CI reports.
