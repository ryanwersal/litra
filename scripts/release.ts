#!/usr/bin/env bun
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const LEVELS = ["major", "minor", "patch"] as const;
type Level = (typeof LEVELS)[number];
type ReleaseMode = Level | "current";

const PACKAGES = [
  "package.json",
  "litra/package.json",
  "litra-cli/package.json",
] as const;
const LIBRARY_NAME = "@ryanwersal/litra";
const CLI_NAME = "@ryanwersal/litra-cli";

const mode = process.argv[2] as ReleaseMode | undefined;
if (
  mode === undefined ||
  (mode !== "current" && !LEVELS.includes(mode as Level))
) {
  console.error("usage: mise run release <major|minor|patch|current>");
  process.exit(1);
}

const bump = (version: string, by: Level): string => {
  const [major, minor, patch] = version.split(".").map(Number);
  if (
    major === undefined ||
    minor === undefined ||
    patch === undefined ||
    [major, minor, patch].some(Number.isNaN)
  ) {
    throw new Error(`Invalid package version: ${version}`);
  }
  if (by === "major") return `${major + 1}.0.0`;
  if (by === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const readPackage = async (path: (typeof PACKAGES)[number]) =>
  Bun.file(path).json() as Promise<{
    name: string;
    version: string;
    dependencies?: Record<string, string>;
  }>;

const requireCleanTree = async (): Promise<void> => {
  const status = (await $`git status --porcelain`.text()).trim();
  if (status) {
    throw new Error("Working tree is dirty; commit or stash before releasing.");
  }
};

const requireSynchronizedVersions = async (): Promise<string> => {
  const packages = await Promise.all(PACKAGES.map(readPackage));
  const version = packages[0].version;
  for (const pkg of packages) {
    if (pkg.version !== version) {
      throw new Error(
        `Package versions must match: ${pkg.name}@${pkg.version} != ${version}`,
      );
    }
  }

  const cli = packages[2];
  if (cli.dependencies?.[LIBRARY_NAME] !== "workspace:^") {
    throw new Error(
      `${CLI_NAME} must depend on ${LIBRARY_NAME} through workspace:^`,
    );
  }
  return version;
};

const verifyRelease = async (): Promise<void> => {
  await $`bun install --frozen-lockfile`;
  await $`bun run build`;
  await $`bun test`;
  await $`bun run package`;
};

const current = await requireSynchronizedVersions();

if (mode !== "current") {
  await requireCleanTree();
  const next = bump(current, mode);
  console.log(`Preparing ${current} -> ${next}`);

  for (const path of PACKAGES) {
    const pkg = await readPackage(path);
    pkg.version = next;
    await Bun.write(path, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  await $`bun install`;
  await verifyRelease();
  console.log(
    `Prepared v${next}; review and commit the version and lockfile changes before publishing.`,
  );
  process.exit(0);
}

await requireCleanTree();
const tag = `v${current}`;
console.log(`Publishing ${tag} from ${await $`git rev-parse HEAD`.text()}`);
await verifyRelease();

const archiveDirectory = await mkdtemp(join(tmpdir(), "litra-release-"));
const libraryArchive = join(archiveDirectory, `litra-${current}.tgz`);
const cliArchive = join(archiveDirectory, `litra-cli-${current}.tgz`);

await $`bun pm pack --filename ${libraryArchive}`.cwd("litra");
await $`bun pm pack --filename ${cliArchive}`.cwd("litra-cli");

await $`npm publish ${libraryArchive} --access public --provenance`;

let publishedLibrary: string | undefined;
for (let attempt = 0; attempt < 12; attempt += 1) {
  try {
    publishedLibrary = (
      await $`npm view ${`${LIBRARY_NAME}@${current}`} version`.quiet().text()
    ).trim();
  } catch {
    // The public registry may need a few seconds to expose the new version.
  }
  if (publishedLibrary === current) break;
  await Bun.sleep(5_000);
}
if (publishedLibrary !== current) {
  throw new Error(
    `${LIBRARY_NAME}@${current} is not visible on the public registry; refusing to publish ${CLI_NAME}.`,
  );
}

await $`npm publish ${cliArchive} --access public --provenance`;
await $`git tag ${tag}`;
await $`git push origin ${tag}`;
await $`gh release create ${tag} --verify-tag --title ${tag} --generate-notes`;

console.log(`Published ${LIBRARY_NAME}@${current} and ${CLI_NAME}@${current}`);
