#!/usr/bin/env bun
import { createRequire } from "node:module";
import { Litra } from "../litra/lib/index.js";

// Resolve the library's dependency and force its lazy native binding to load.
// Litra wraps constructor errors, including binding failures, as a missing device.
const require = createRequire(
  new URL("../litra/lib/index.js", import.meta.url),
);
require("node-hid").devices();

try {
  const litra = new Litra();
  litra.close();
  console.log("node-hid native binding OK — a Litra device is connected");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unable to find a Logitech Litra")) {
    console.log(
      "node-hid native binding OK — no device connected (expected in CI)",
    );
  } else {
    throw error;
  }
}
