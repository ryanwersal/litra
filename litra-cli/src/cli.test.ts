import { afterEach, beforeEach, expect, it, mock, spyOn } from "bun:test";
import { files, mockFs, restoreEnv, stubEnv } from "./testing";

const calls: string[] = [];
let failingAction: string | undefined;

const record = (action: string): void => {
  calls.push(action);
  if (action === failingAction) throw new Error(`failed to ${action}`);
};

class FakeLitra {
  on() {
    record("on");
  }
  off() {
    record("off");
  }
  setBrightness(level: number) {
    record(`brightness:${level}`);
  }
  setTemperature(temp: number) {
    record(`temperature:${temp}`);
  }
  close() {
    record("close");
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
  failingAction = undefined;
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

it("rejects invalid flags before opening or persisting", async () => {
  for (const args of [
    ["on", "-b", "abc"],
    ["on", "-b", "0"],
    ["on", "-b", "1.5"],
    ["on", "-t", "6501"],
  ]) {
    await expect(run(args)).rejects.toThrow();
  }
  expect(calls).toEqual([]);
  expect(files.size).toBe(0);
});

it("closes the device and does not persist after a device error", async () => {
  failingAction = "temperature:5000";
  await expect(run(["on", "-b", "80", "-t", "5000"])).rejects.toThrow(
    "failed to temperature:5000",
  );
  expect(calls).toEqual(["on", "brightness:80", "temperature:5000", "close"]);
  expect(files.size).toBe(0);
});

it("rejects unknown commands", async () => {
  await expect(run(["frobnicate"])).rejects.toThrow();
});

it("rejects extra positional arguments", async () => {
  await expect(run(["on", "unexpected"])).rejects.toThrow(
    'Unexpected argument "unexpected"',
  );
  expect(calls).toEqual([]);
});
