import { Command, Flags } from "@oclif/core";
import Conf from "conf";
import { turnOn, setBrightness, setTemperature } from "@ryanwersal/litra";

interface LastValues {
  brightness: number;
  temperature: number;
}

export default class OnCommand extends Command {
  static description = "Turn on Litra";

  static flags = {
    brightness: Flags.integer({
      char: "b",
      description: "Brightness (1-100)",
    }),
    temperature: Flags.integer({
      char: "t",
      description: "Temperature (2700-6500)",
    }),
  };

  async run() {
    const config = new Conf({
      schema: {
        lastValues: {
          type: "object",
          properties: {
            brightness: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            temperature: {
              type: "number",
              minimum: 2700,
              maximum: 6500,
              default: 3000,
            },
          },
        },
      },
    });

    const {
      flags: { brightness, temperature },
    } = await this.parse(OnCommand);

    const lastValues = config.get<string, LastValues>("lastValues", {
      brightness: 50,
      temperature: 3000,
    });
    const values: LastValues = {
      brightness: brightness ?? lastValues.brightness,
      temperature: temperature ?? lastValues.temperature,
    };

    turnOn();
    setBrightness(values.brightness);
    setTemperature(values.temperature);

    config.set("lastValues", values);
  }
}
