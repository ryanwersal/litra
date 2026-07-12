#!/usr/bin/env bun
import { $ } from "bun";

const LEVELS = ["major", "minor", "patch"] as const;
type Level = (typeof LEVELS)[number];

const PACKAGES = [
  "package.json",
  "litra/package.json",
  "litra-cli/package.json",
];

const level = process.argv[2];
if (level === undefined || !LEVELS.includes(level as Level)) {
  console.error("usage: mise run release <major|minor|patch>");
  process.exit(1);
}

const dryRun = process.env.DRY_RUN === "1";

const bump = (version: string, by: Level): string => {
  const [major, minor, patch] = version.split(".").map(Number);
  if (by === "major") return `${major + 1}.0.0`;
  if (by === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const root = await Bun.file("package.json").json();
const next = bump(root.version, level as Level);
const tag = `v${next}`;

console.log(
  `Releasing ${root.version} -> ${next}${dryRun ? " (dry run)" : ""}`,
);

if (!dryRun) {
  const status = (await $`git status --porcelain`.text()).trim();
  if (status) {
    console.error("Working tree is dirty; commit or stash before releasing.");
    process.exit(1);
  }
}

for (const path of PACKAGES) {
  const pkg = await Bun.file(path).json();
  pkg.version = next;
  await Bun.write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

await $`bun install`;
await $`bun run build`;
await $`bun test`;

if (dryRun) {
  console.log("Dry run complete; skipping commit, tag, and publish.");
  process.exit(0);
}

await $`git commit -am ${`release: ${tag}`}`;
await $`git tag ${tag}`;
await $`bun publish`.cwd("litra");
await $`bun publish`.cwd("litra-cli");
await $`git push --follow-tags`;
await $`gh release create ${tag} --verify-tag --title ${tag} --generate-notes`;

console.log(`Published ${tag}`);
