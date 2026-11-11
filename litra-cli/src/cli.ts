import { parseArgs } from "node:util";
import { Litra } from "@ryanwersal/litra";
import {
  isBrightness,
  isTemperature,
  loadSettings,
  type Settings,
  saveSettings,
} from "./config";

const usage = `litra — control a Logitech Litra Glow

Usage:
  litra on [-b <1-100>] [-t <2700-6500>]
  litra off

Options:
  -b, --brightness   Brightness percentage (1-100)
  -t, --temperature  Colour temperature in Kelvin (2700-6500)
  -h, --help         Show this help`;

const parseInteger = (
  name: string,
  raw: string,
  isValid: (value: unknown) => value is number,
  range: string,
): number => {
  const value = Number(raw);
  if (!isValid(value)) {
    throw new Error(
      `--${name} must be an integer between ${range}, received "${raw}"`,
    );
  }
  return value;
};

const runOn = async (flags: {
  brightness?: string;
  temperature?: string;
}): Promise<void> => {
  const stored = await loadSettings();
  const settings: Settings = {
    brightness:
      flags.brightness === undefined
        ? stored.brightness
        : parseInteger(
            "brightness",
            flags.brightness,
            isBrightness,
            "1 and 100",
          ),
    temperature:
      flags.temperature === undefined
        ? stored.temperature
        : parseInteger(
            "temperature",
            flags.temperature,
            isTemperature,
            "2700 and 6500",
          ),
  };

  using litra = new Litra();
  litra.on();
  litra.setBrightness(settings.brightness);
  litra.setTemperature(settings.temperature);

  await saveSettings(settings);
};

const runOff = (): void => {
  using litra = new Litra();
  litra.off();
};

export const run = async (argv: string[]): Promise<void> => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      brightness: { type: "string", short: "b" },
      temperature: { type: "string", short: "t" },
      help: { type: "boolean", short: "h" },
    },
  });

  const command = positionals[0];
  if (values.help || command === undefined) {
    console.log(usage);
    return;
  }
  if (positionals.length > 1) {
    throw new Error(
      `Unexpected argument "${positionals[1]}". Run \`litra --help\`.`,
    );
  }

  switch (command) {
    case "on":
      await runOn(values);
      break;
    case "off":
      runOff();
      break;
    default:
      throw new Error(`Unknown command "${command}". Run \`litra --help\`.`);
  }
};
