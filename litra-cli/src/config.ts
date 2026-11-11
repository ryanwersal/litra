import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Settings {
  brightness: number;
  temperature: number;
}

export const defaultSettings: Settings = { brightness: 50, temperature: 3000 };

export const isBrightness = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 100;

export const isTemperature = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 2700 &&
  value <= 6500;

const settingsPath = (): string => {
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(base, "litra", "settings.json");
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const stored: unknown = JSON.parse(await readFile(settingsPath(), "utf8"));
    if (
      typeof stored !== "object" ||
      stored === null ||
      Array.isArray(stored)
    ) {
      return { ...defaultSettings };
    }

    const values = stored as Record<string, unknown>;
    return {
      brightness: isBrightness(values.brightness)
        ? values.brightness
        : defaultSettings.brightness,
      temperature: isTemperature(values.temperature)
        ? values.temperature
        : defaultSettings.temperature,
    };
  } catch {
    return { ...defaultSettings };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  const path = settingsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`);
};
