import { HID } from "node-hid";
import {
  vendorId,
  productId,
  lightOn,
  lightOff,
  minBrightness,
  maxBrightness,
} from "./constants";

const getLitra = (): HID => {
  const device = new HID(vendorId, productId);
  if (!device) {
    throw new Error("Failed to find Logi Litra to control.");
  }
  device.on("data", console.log);
  device.on("error", console.log);
  return device;
};

export const turnOn = () => {
  const device = getLitra();
  device.write([
    0x00,
    0x11,
    0xff,
    0x04,
    0x1c,
    lightOn,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  device.close();
};

export const turnOff = () => {
  const device = getLitra();
  device.write([
    0x00,
    0x11,
    0xff,
    0x04,
    0x1c,
    lightOff,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  device.close();
};

export const setBrightness = (level: number) => {
  if (level < 1 || level > 100) {
    throw new Error("Invalid brightness specified. Must be between 1 and 100.");
  }

  const device = getLitra();
  const clampedLevel = Math.floor(
    minBrightness + (level / 100) * (maxBrightness - minBrightness)
  );
  device.write([
    0x00,
    0x11,
    0xff,
    0x04,
    0x4c,
    0x00,
    clampedLevel,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  device.close();
};

export const setTemperature = (temp: number) => {
  if (temp < 2700 || temp > 6500) {
    throw new Error(
      "Invalid temperature specified. Must be between 2700 and 6500."
    );
  }

  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setInt16(0, temp, false);
  const bytes = [view.getInt8(0), view.getInt8(1)];

  const device = getLitra();
  device.write([
    0x00,
    0x11,
    0xff,
    0x04,
    0x9c,
    ...bytes,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  device.close();
};
