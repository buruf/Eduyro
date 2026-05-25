// jest.setup.js
// Polyfills + module mocks loaded after the test framework, before each test.

// ─────────────────────────────────────────────
// Polyfills
// ─────────────────────────────────────────────

const util = require("util");
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = util.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = util.TextDecoder;
}

const undici = (() => {
  try { return require("undici"); } catch { return null; }
})();
if (typeof globalThis.Request === "undefined") {
  if (undici) {
    globalThis.Request = undici.Request;
    globalThis.Response = undici.Response;
    globalThis.Headers = undici.Headers;
    globalThis.fetch = globalThis.fetch || undici.fetch;
  } else {
    globalThis.Request = class { constructor() {} };
    globalThis.Response = class { constructor() {} };
    globalThis.Headers = Map;
  }
}

if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = require("crypto").webcrypto;
}

// ─────────────────────────────────────────────
// Module mocks — applied to all tests
// ─────────────────────────────────────────────

// nanoid — ESM-only, can't be loaded by Jest's CJS runtime
jest.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: (size = 12) => {
      counter++;
      return `mock-${counter.toString().padStart(size, "0")}`;
    },
    customAlphabet: () => () => `mock-${++counter}`,
    urlAlphabet: "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",
  };
});

// @/lib/api/helpers — bypass the rate-limit check that depends on req.nextUrl
// (which isn't easily mockable in plain test requests). The actual response
// helpers (ok, err, etc.) still come from the real module.
jest.mock("@/lib/api/helpers", () => {
  const actual = jest.requireActual("@/lib/api/helpers");
  return {
    ...actual,
    withRateLimit: jest.fn(() => null), // null = "not rate-limited"
  };
});

// @/lib/auth — depends on @auth/prisma-adapter which isn't in node_modules
jest.mock("@/lib/auth", () => ({
  authOptions: {
    providers: [],
    callbacks: {},
    session: { strategy: "jwt" },
  },
}));

// next/headers — only works in real request context; tests don't have one
jest.mock("next/headers", () => ({
  headers: () => new Map([["stripe-signature", "test_sig"]]),
  cookies: () => new Map(),
}));

// next-auth — used by withAuth/withRole; just return null session in tests
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(async () => null),
}));

// ─────────────────────────────────────────────
// Console noise suppression
// ─────────────────────────────────────────────

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("not wrapped in act") ||
        args[0].includes("ReactDOMTestUtils.act"))
    ) {
      return;
    }
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
