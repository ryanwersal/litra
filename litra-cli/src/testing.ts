import { mock } from "bun:test";

const savedEnv = new Map<string, string | undefined>();

export const stubEnv = (key: string, value: string): void => {
  if (!savedEnv.has(key)) {
    savedEnv.set(key, process.env[key]);
  }
  process.env[key] = value;
};

export const restoreEnv = (): void => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  savedEnv.clear();
};

export const files = new Map<string, string>();

export const mockFs = (): void => {
  mock.module("node:fs/promises", () => ({
    readFile: async (path: string) => {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error(`ENOENT: ${path}`);
      }
      return content;
    },
    writeFile: async (path: string, data: string) => {
      files.set(path, data);
    },
    mkdir: async () => undefined,
  }));
};
