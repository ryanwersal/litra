import { beforeEach, describe, expect, it, mock } from "bun:test";
import { maxBrightness, productId, vendorId } from "./constants";

const writes: number[][] = [];
const construct = mock((_vendor: number, _product: number) => {});
const write = mock((data: number[]) => {
  writes.push(data);
});
const close = mock(() => {});

class FakeHID {
  constructor(vendor: number, product: number) {
    construct(vendor, product);
  }
  write = write;
  close = close;
}

mock.module("node-hid", () => ({ HID: FakeHID }));

const { Litra, turnOn, turnOff, setBrightness, setTemperature } = await import(
  "./index"
);

beforeEach(() => {
  writes.length = 0;
  mock.clearAllMocks();
});

const lastWrite = (): number[] => {
  const data = writes.at(-1);
  if (!data) {
    throw new Error("no write was recorded");
  }
  return data;
};

describe("Litra", () => {
  it("opens the device with the Litra vendor and product ids", () => {
    new Litra();
    expect(construct).toHaveBeenCalledWith(vendorId, productId);
  });

  it("writes fixed-length 21-byte reports", () => {
    const litra = new Litra();
    litra.on();
    litra.off();
    litra.setBrightness(50);
    litra.setTemperature(4000);
    for (const data of writes) {
      expect(data).toHaveLength(21);
    }
  });

  it("turns the light on and off", () => {
    const litra = new Litra();
    litra.on();
    expect(lastWrite()[5]).toBe(0x01);
    litra.off();
    expect(lastWrite()[5]).toBe(0x00);
  });

  it("scales brightness between the device minimum and maximum", () => {
    const litra = new Litra();
    litra.setBrightness(1);
    expect(lastWrite()[6]).toBe(22);
    litra.setBrightness(100);
    expect(lastWrite()[6]).toBe(maxBrightness);
  });

  it("encodes temperature as unsigned big-endian bytes", () => {
    const litra = new Litra();
    litra.setTemperature(2700);
    expect(lastWrite().slice(5, 7)).toEqual([0x0a, 0x8c]);
    litra.setTemperature(6500);
    expect(lastWrite().slice(5, 7)).toEqual([0x19, 0x64]);
  });

  it("rejects out-of-range brightness and temperature", () => {
    const litra = new Litra();
    expect(() => litra.setBrightness(0)).toThrow(RangeError);
    expect(() => litra.setBrightness(101)).toThrow(RangeError);
    expect(() => litra.setTemperature(2699)).toThrow(RangeError);
    expect(() => litra.setTemperature(6501)).toThrow(RangeError);
  });

  it("closes on dispose", () => {
    {
      using litra = new Litra();
      litra.on();
    }
    expect(close).toHaveBeenCalledTimes(1);
  });
});

describe("convenience functions", () => {
  it("open and close the device around a single action", () => {
    turnOn();
    turnOff();
    setBrightness(75);
    setTemperature(5000);
    expect(construct).toHaveBeenCalledTimes(4);
    expect(close).toHaveBeenCalledTimes(4);
  });
});
