import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Settings {
  brightness: number;
  temperature: number;
}

export const defaultSettings: Settings = { brightness: 50, temperature: 3000 };

const settingsPath = (): string => {
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(base, "litra", "settings.json");
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const stored = JSON.parse(await readFile(settingsPath(), "utf8"));
    return { ...defaultSettings, ...stored };
  } catch {
    return { ...defaultSettings };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  const path = settingsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`);
};
