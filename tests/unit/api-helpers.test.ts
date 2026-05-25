// tests/unit/api-helpers.test.ts
// Tests for the response-builder helpers.
// We mock @/lib/auth to avoid pulling in the full auth stack (which requires
// @auth/prisma-adapter and other heavy deps not needed for these unit tests).

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));
jest.mock("@/lib/db", () => ({ db: {} }));

import {
  ok,
  created,
  noContent,
  err,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
} from "@/lib/api/helpers";

describe("API response helpers", () => {
  describe("ok()", () => {
    it("returns a 200 with success=true and data payload", async () => {
      const res = ok({ hello: "world" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ hello: "world" });
    });

    it("supports custom status codes", async () => {
      const res = ok({ x: 1 }, 202);
      expect(res.status).toBe(202);
    });
  });

  describe("created()", () => {
    it("returns 201", async () => {
      const res = created({ id: "abc" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: "abc" });
    });
  });

  describe("noContent()", () => {
    it("returns 204", () => {
      const res = noContent();
      expect(res.status).toBe(204);
    });
  });

  describe("err()", () => {
    it("returns 400 by default", async () => {
      const res = err("Bad request");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Bad request");
    });

    it("supports custom status codes", async () => {
      const res = err("Teapot", 418);
      expect(res.status).toBe(418);
    });

    it("includes details when provided", async () => {
      const res = err("Validation failed", 400, "VALIDATION", { field: ["required"] });
      const body = await res.json();
      expect(body.details).toEqual({ field: ["required"] });
    });
  });

  describe("Status-specific helpers", () => {
    it("unauthorized() returns 401", () => {
      expect(unauthorized().status).toBe(401);
    });
    it("forbidden() returns 403", () => {
      expect(forbidden().status).toBe(403);
    });
    it("notFound() returns 404", () => {
      expect(notFound().status).toBe(404);
    });
    it("conflict() returns 409", () => {
      expect(conflict("Already exists").status).toBe(409);
    });
    it("validationError() returns 422 with details", async () => {
      const res = validationError({ email: ["required"] });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.details).toEqual({ email: ["required"] });
    });
    it("serverError() returns 500", () => {
      expect(serverError().status).toBe(500);
    });
  });

  describe("Response body shape", () => {
    it("success responses have { success: true, data: ... }", async () => {
      const r = ok({ a: 1 });
      const body = await r.json();
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("data");
      expect(body).not.toHaveProperty("error");
    });

    it("error responses have { success: false, error: ... }", async () => {
      const r = err("boom");
      const body = await r.json();
      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("error", "boom");
      expect(body).not.toHaveProperty("data");
    });
  });
});
