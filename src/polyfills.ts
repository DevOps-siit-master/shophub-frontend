import { Buffer } from 'buffer';

// siwe (via its ABNF parser) expects a global `Buffer`, which browsers do not
// provide. This module is imported first in main.tsx so the global is in place
// before any siwe code runs.
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
