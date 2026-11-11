# Dependency maintenance notes

This maintenance pass assessed the grouped Dependabot proposals against the
repository's Bun 1.3 and Node 22 support policy. Registry versions and the
grouped proposal were observed on 2026-11-11.

## Accepted

- Biome 2.6.6 replaces 2.5.2. This is the current compatible Biome 2 release,
  and its matching schema is used by `biome.json`.
- Node 22 types move from 22.20.0 to 22.20.5. Staying on the Node 22 type line
  matches the runtime selected by mise.
- Manifest ranges now record the already-tested Bun 1.3.14 types and
  TypeScript 5.9.3, node-hid 2.2.0, and node-hid types 1.3.4 lockfile
  versions. The package-manager declaration also matches Bun 1.3.14, which
  produces this lockfile and is used by CI.

## Deferred from the grouped major update

- Node HID 3.4.0 and its 3.0.0 types are deferred together. Installing the
  proposed runtime under the repository's Bun workspace runs its prebuild
  verifier from the workspace root, where it cannot resolve the package's
  `binding-options.js`, and falls back to a native rebuild. Keeping node-hid
  2.2.0 preserves the reproducible Bun install and known native binding path;
  `mise run ci` loads that real binding through the built CommonJS package in
  both Bun 1.3 and Node 22.
- Node 26 types are deferred because the project intentionally runs Node 22.
- Bun 1.4 types are deferred until the Bun 1.4 runtime is adopted and tested.
- TypeScript 7 is a major compiler update with no required source fix here.
  TypeScript 5.9.3 remains the current compiler on the established major line.

The existing `mise run release` task and `scripts/release.ts` remain the only
release path. This maintenance revision does not choose a release version,
publish packages, create a tag, or change release credentials.
