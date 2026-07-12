import { afterEach, beforeEach, expect, it, mock, spyOn } from "bun:test";
import { files, mockFs, restoreEnv, stubEnv } from "./testing";

const calls: string[] = [];

class FakeLitra {
  on() {
    calls.push("on");
  }
  off() {
    calls.push("off");
  }
  setBrightness(level: number) {
    calls.push(`brightness:${level}`);
  }
  setTemperature(temp: number) {
    calls.push(`temperature:${temp}`);
  }
  close() {
    calls.push("close");
  }
  [Symbol.dispose]() {
    this.close();
  }
}

mock.module("@ryanwersal/litra", () => ({ Litra: FakeLitra }));
mockFs();

const { run } = await import("./cli");
const { loadSettings } = await import("./config");

beforeEach(() => {
  calls.length = 0;
  files.clear();
  stubEnv("XDG_CONFIG_HOME", "/config");
});

afterEach(() => {
  restoreEnv();
});

it("turns on with stored defaults and persists them", async () => {
  await run(["on"]);
  expect(calls).toEqual(["on", "brightness:50", "temperature:3000", "close"]);
  expect(await loadSettings()).toEqual({ brightness: 50, temperature: 3000 });
});

it("applies flags and remembers them for next time", async () => {
  await run(["on", "-b", "80", "-t", "5000"]);
  expect(calls).toContain("brightness:80");
  expect(calls).toContain("temperature:5000");
  expect(await loadSettings()).toEqual({ brightness: 80, temperature: 5000 });

  calls.length = 0;
  await run(["on"]);
  expect(calls).toContain("brightness:80");
  expect(calls).toContain("temperature:5000");
});

it("turns off and disposes the device", async () => {
  await run(["off"]);
  expect(calls).toEqual(["off", "close"]);
});

it("prints usage and touches no device with --help", async () => {
  const log = spyOn(console, "log").mockImplementation(() => {});
  await run(["--help"]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0]?.[0]).toContain("Usage:");
  expect(calls).toEqual([]);
  log.mockRestore();
});

it("does not persist settings when a flag is invalid", async () => {
  expect(run(["on", "-b", "abc"])).rejects.toThrow();
  expect(files.size).toBe(0);
});

it("rejects unknown commands", () => {
  expect(run(["frobnicate"])).rejects.toThrow();
});
