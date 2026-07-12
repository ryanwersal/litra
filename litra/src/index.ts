import { HID } from "node-hid";
import {
  lightOff,
  lightOn,
  maxBrightness,
  minBrightness,
  productId,
  vendorId,
} from "./constants";

const REPORT_LENGTH = 21;

const report = (...payload: number[]): number[] => {
  const data = [0x00, ...payload];
  return data.concat(new Array(REPORT_LENGTH - data.length).fill(0x00));
};

const scaleBrightness = (level: number): number =>
  Math.floor(minBrightness + (level / 100) * (maxBrightness - minBrightness));

export class Litra implements Disposable {
  private readonly device: HID;

  constructor() {
    try {
      this.device = new HID(vendorId, productId);
    } catch (cause) {
      throw new Error("Unable to find a Logitech Litra to control.", { cause });
    }
  }

  on(): void {
    this.device.write(report(0x11, 0xff, 0x04, 0x1c, lightOn));
  }

  off(): void {
    this.device.write(report(0x11, 0xff, 0x04, 0x1c, lightOff));
  }

  setBrightness(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > 100) {
      throw new RangeError("Brightness must be an integer between 1 and 100.");
    }
    this.device.write(
      report(0x11, 0xff, 0x04, 0x4c, 0x00, scaleBrightness(level)),
    );
  }

  setTemperature(temp: number): void {
    if (!Number.isInteger(temp) || temp < 2700 || temp > 6500) {
      throw new RangeError(
        "Temperature must be an integer between 2700 and 6500.",
      );
    }
    this.device.write(
      report(0x11, 0xff, 0x04, 0x9c, (temp >> 8) & 0xff, temp & 0xff),
    );
  }

  close(): void {
    this.device.close();
  }

  [Symbol.dispose](): void {
    this.close();
  }
}

const withLitra = <T>(action: (litra: Litra) => T): T => {
  const litra = new Litra();
  try {
    return action(litra);
  } finally {
    litra.close();
  }
};

export const turnOn = (): void => withLitra((litra) => litra.on());
export const turnOff = (): void => withLitra((litra) => litra.off());
export const setBrightness = (level: number): void =>
  withLitra((litra) => litra.setBrightness(level));
export const setTemperature = (temp: number): void =>
  withLitra((litra) => litra.setTemperature(temp));
