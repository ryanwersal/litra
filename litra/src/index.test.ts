import { setBrightness, setTemperature, turnOff, turnOn } from ".";

describe("on/off", () => {
  it("should turn on", () => {
    turnOn();
  });

  it("should turn off", () => {
    turnOff();
  });
});

describe("brightness", () => {
  beforeAll(() => turnOn());
  afterAll(() => turnOff());

  it("minimum brightness", () => {
    setBrightness(1);
  });

  it("maximum brightness", () => {
    setBrightness(100);
  });
});

describe("color temperature", () => {
  beforeAll(() => turnOn());
  afterAll(() => turnOff());

  it("supports hot temperature", () => {
    setTemperature(2700);
  });

  it("supports cool temperature", () => {
    setTemperature(6500);
  });
});
