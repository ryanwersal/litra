#!/usr/bin/env bun
import { createRequire } from "node:module";
import { productId, vendorId } from "../litra/lib/constants.js";
import { Litra } from "../litra/lib/index.js";

// Resolve the library's dependency and force its lazy native binding to load.
// Litra wraps constructor errors, including missing bindings, as device-not-found.
const require = createRequire(import.meta.resolve("../litra/lib/index.js"));
const { devices } = require("node-hid");
const connected = devices(vendorId, productId).length > 0;

if (connected) {
  const litra = new Litra();
  litra.close();
  console.log("node-hid native binding OK — a Litra device is connected");
} else {
  console.log(
    "node-hid native binding OK — no device connected (expected in CI)",
  );
}
