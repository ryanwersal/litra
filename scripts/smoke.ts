#!/usr/bin/env bun
import { Litra } from "../litra/lib/index.js";

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
