import { Command, Flags } from "@oclif/core";
import { turnOn, setBrightness, setTemperature } from "@ryanwersal/litra";

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
    const {
      flags: { brightness, temperature },
    } = await this.parse(OnCommand);

    console.log(brightness, temperature);

    turnOn();

    if (brightness) {
      setBrightness(brightness);
    }

    if (temperature) {
      setTemperature(temperature);
    }
  }
}
