#!/usr/bin/env node
import { createRequire } from "node:module";

// Load the package through its CommonJS manifest, then resolve its dependency
// and force the lazy native binding to load in each supported runtime.
const require = createRequire(import.meta.url);
const library = require("../litra");
for (const name of [
  "Litra",
  "turnOn",
  "turnOff",
  "setBrightness",
  "setTemperature",
]) {
  if (typeof library[name] !== "function") {
    throw new Error(`CommonJS package is missing the ${name} export`);
  }
}

const { productId, vendorId } = require("../litra/lib/constants.js");
const libraryRequire = createRequire(require.resolve("../litra/lib/index.js"));
const { devices } = libraryRequire("node-hid");
const connected = devices(vendorId, productId).length > 0;
const runtime = process.versions.bun
  ? `Bun ${process.versions.bun}`
  : `Node ${process.versions.node}`;

if (connected) {
  const litra = new library.Litra();
  litra.close();
  console.log(`${runtime}: node-hid binding OK — a Litra is connected`);
} else {
  console.log(`${runtime}: node-hid binding OK — no Litra (expected in CI)`);
}
