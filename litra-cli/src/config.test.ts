import { afterEach, beforeEach, expect, it } from "bun:test";
import { files, mockFs, restoreEnv, stubEnv } from "./testing";

mockFs();
const { defaultSettings, loadSettings, saveSettings } = await import(
  "./config"
);

const settingsFile = "/config/litra/settings.json";

beforeEach(() => {
  files.clear();
  stubEnv("XDG_CONFIG_HOME", "/config");
});

afterEach(() => {
  restoreEnv();
});

it("returns defaults when nothing is stored", async () => {
  expect(await loadSettings()).toEqual(defaultSettings);
});

it("writes settings under the XDG config path", async () => {
  await saveSettings({ brightness: 42, temperature: 4200 });
  expect(files.has(settingsFile)).toBe(true);
  expect(await loadSettings()).toEqual({ brightness: 42, temperature: 4200 });
});

it("honours XDG_CONFIG_HOME when it changes", async () => {
  stubEnv("XDG_CONFIG_HOME", "/custom");
  await saveSettings({ brightness: 5, temperature: 3000 });
  expect(files.has("/custom/litra/settings.json")).toBe(true);
});

it("merges partial stored settings over defaults", async () => {
  files.set(settingsFile, JSON.stringify({ brightness: 10 }));
  expect(await loadSettings()).toEqual({ brightness: 10, temperature: 3000 });
});

it("falls back to defaults when the stored file is corrupt", async () => {
  files.set(settingsFile, "not json");
  expect(await loadSettings()).toEqual(defaultSettings);
});
