#!/usr/bin/env bun
import { stat } from "node:fs/promises";
import { join } from "node:path";

interface PackageCheck {
  directory: string;
  required: string[];
}

const packages: PackageCheck[] = [
  {
    directory: "litra",
    required: [
      "package.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "lib/index.js",
      "lib/index.d.ts",
    ],
  },
  {
    directory: "litra-cli",
    required: [
      "package.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "bin/run",
      "lib/index.js",
      "lib/index.d.ts",
    ],
  },
];

const packFiles = async (directory: string): Promise<Set<string>> => {
  const child = Bun.spawn(["bun", "pm", "pack", "--dry-run"], {
    cwd: directory,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(
      `Unable to inspect ${directory} package:\n${stderr}${stdout}`,
    );
  }

  const files = new Set<string>();
  for (const line of `${stdout}\n${stderr}`.split("\n")) {
    const match = /^packed\s+\S+\s+(.+)$/.exec(line);
    if (match?.[1]) files.add(match[1]);
  }
  return files;
};

for (const check of packages) {
  const files = await packFiles(check.directory);
  for (const required of check.required) {
    if (!files.has(required)) {
      throw new Error(`${check.directory} package is missing ${required}`);
    }
  }
  for (const file of files) {
    if (
      file.includes(".tsbuildinfo") ||
      file.startsWith("src/") ||
      file.includes(".test.") ||
      file === "tsconfig.json"
    ) {
      throw new Error(`${check.directory} package contains unexpected ${file}`);
    }
  }
  console.log(`${check.directory} package contents OK (${files.size} files)`);
}

const executable = await stat(join("litra-cli", "bin", "run"));
if ((executable.mode & 0o111) === 0) {
  throw new Error("litra-cli/bin/run is not executable");
}

const runCli = async (
  ...args: string[]
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> => {
  const executable = join(process.cwd(), "litra-cli", "bin", "run");
  const child = Bun.spawn([executable, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { exitCode, stdout, stderr };
};

const help = await runCli("--help");
if (help.exitCode !== 0 || !help.stdout.includes("Usage:")) {
  throw new Error(`CLI help failed:\n${help.stderr}${help.stdout}`);
}

const unknown = await runCli("unknown-command");
if (unknown.exitCode !== 1 || !unknown.stderr.includes("Unknown command")) {
  throw new Error(
    `CLI error handling failed:\n${unknown.stderr}${unknown.stdout}`,
  );
}
console.log("litra-cli executable help and error behavior OK");
