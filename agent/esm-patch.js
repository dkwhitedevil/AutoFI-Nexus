import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Patch global require for cbor2
global.require = (path) => {
  if (path === "cbor2") {
    // Dynamically import cbor2 if requested by SDK
    return import("cbor2");
  }
  return require(path);
};
