# Dependency maintenance notes

This maintenance pass assessed the grouped Dependabot proposals individually
against the library, CLI, package archives, and native binding. Registry
versions and tool releases were observed on 2026-11-11.

## Accepted

- Bun 1.4.4 is the current stable Bun release and now produces the lockfile;
  mise selects the 1.4 line, `packageManager` records the exact version, and
  `@types/bun` matches it. The CLI's existing `bun >=1.3.0` engine remains
  valid: Bun 1.3.14 still builds and runs all 27 tests, and a freshly packed
  library installs and loads its native binding with Bun 1.3.14.
- Node 26.13.1 and `@types/node` 26.6.6 replace the Node 22 tool/type line.
  The built CommonJS package and native binding load under both Node 26.13.1
  and the previously supported Node 22.23.5.
- TypeScript 7.0.2 replaces 5.9.3. TypeScript 7 removed the old `node10`
  resolver behind `moduleResolution: "Node"`; the configuration now uses the
  paired Node16 module and resolver modes with explicit Node types. Package
  manifests still declare CommonJS, and the package audit exercises the
  emitted JavaScript and declarations.
- Node HID 3.4.0 replaces 2.2.0. Its install lifecycle completes from a fresh
  frozen lockfile under Bun 1.4.4, and its real native binding is exercised
  through the built package in Bun 1.4.4 and Node 26.13.1. A fresh consumer
  install of the packed library also succeeds and loads the binding under Bun
  1.3.14 and Node 22.23.5. Node HID now bundles declarations, so the deprecated
  `@types/node-hid` stub is removed instead of adopting its grouped 3.0.0 bump.
- Biome 2.6.6 remains the current release and its matching schema remains in
  `biome.json`.

No part of the grouped major proposal remains deferred: each major line was
accepted only after its relevant build, test, package, and native-loading
checks passed. The public APIs, CLI commands/options and persisted settings,
CommonJS convention, and supported Bun 1.3/Node 22 loading behavior remain
unchanged.

The existing `mise run release` task and `scripts/release.ts` remain the only
release path. This maintenance revision does not choose a release version,
publish packages, create a tag, or change release credentials.
