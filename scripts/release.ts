#!/usr/bin/env bun
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const LEVELS = ["major", "minor", "patch"] as const;
type Level = (typeof LEVELS)[number];

const PACKAGES = [
  "package.json",
  "litra/package.json",
  "litra-cli/package.json",
];

const level = process.argv[2];
if (level !== "current" && !LEVELS.includes(level as Level)) {
  console.error("usage: mise run release <major|minor|patch|current>");
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
const publishing = level === "current";
const next = publishing ? root.version : bump(root.version, level as Level);
const tag = `v${next}`;

console.log(
  `Releasing ${root.version} -> ${next}${dryRun ? " (dry run)" : ""}`,
);

if (publishing && !dryRun) {
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GITHUB_REF !== "refs/heads/main" ||
    !process.env.ACTIONS_ID_TOKEN_REQUEST_URL
  ) {
    throw new Error(
      "Run the Release workflow on main to publish through npm OIDC.",
    );
  }
  const status = (await $`git status --porcelain`.text()).trim();
  if (status) {
    console.error("Working tree is dirty; commit or stash before releasing.");
    process.exit(1);
  }
}

for (const path of PACKAGES) {
  const pkg = await Bun.file(path).json();
  if (publishing) {
    if (pkg.version !== next) {
      throw new Error(`${path} must have version ${next} before publishing.`);
    }
  } else {
    pkg.version = next;
    if (path === "litra-cli/package.json") {
      pkg.dependencies["@ryanwersal/litra"] = `^${next}`;
    }
    await Bun.write(path, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

if (publishing) {
  await $`bun install --frozen-lockfile`;
} else {
  await $`bun install`;
}
await $`bun run build`;
await $`bun test`;

const tarballs = await mkdtemp(join(tmpdir(), "litra-release-"));
try {
  for (const name of ["litra", "litra-cli"]) {
    await $`bun pm pack --filename ${join(tarballs, `${name}.tgz`)}`.cwd(name);
  }

  const packedCLI = JSON.parse(
    await $`tar -xOf ${join(tarballs, "litra-cli.tgz")} package/package.json`.text(),
  );
  if (packedCLI.dependencies["@ryanwersal/litra"] !== `^${next}`) {
    throw new Error(
      "Packed CLI must depend on the library version being released.",
    );
  }

  if (!publishing || dryRun) {
    console.log(
      `Prepared ${tag}; land the version changes before running the Release workflow.`,
    );
  } else {
    await $`git tag -a ${tag} -m ${tag}`;
    await $`npm publish ${join(tarballs, "litra.tgz")} --access public --provenance`;
    await $`npm publish ${join(tarballs, "litra-cli.tgz")} --access public --provenance`;
    await $`git push origin ${tag}`;
    await $`gh release create ${tag} --verify-tag --title ${tag} --generate-notes`;

    console.log(`Published ${tag}`);
  }
} finally {
  await rm(tarballs, { recursive: true, force: true });
}
