import { describe, it, expect, vi, afterEach } from "vitest";

const ORIGINAL_ENV = process.env;

function setTestEnv(env: NodeJS.ProcessEnv) {
  const {
    NODE_ENV: _NODE_ENV,
    JWT_SECRET: _JWT_SECRET,
    JWT_REFRESH_SECRET: _JWT_REFRESH_SECRET,
    NEXT_PUBLIC_APP_URL: _NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: _RESEND_API_KEY,
    PERSISTENCE_DRIVER: _PERSISTENCE_DRIVER,
    ...rest
  } = ORIGINAL_ENV;

  process.env = {
    ...rest,
    ...env,
  };
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.resetModules(); // VERY IMPORTANT for env tests
});

describe("env config", () => {
  // ---------------------------------------------------------------------------
  // Happy paths
  // ---------------------------------------------------------------------------

  it("loads required env vars correctly", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "access-secret",
      JWT_REFRESH_SECRET: "refresh-secret",
      NEXT_PUBLIC_APP_URL: "http://example.com",
      RESEND_API_KEY: "email-key",
    });

    const env = await import("./env");

    expect(env.NODE_ENV).toBe("development");
    expect(env.JWT_SECRET).toBe("access-secret");
    expect(env.JWT_REFRESH_SECRET).toBe("refresh-secret");
    expect(env.APP_URL).toBe("http://example.com");
    expect(env.RESEND_API_KEY).toBe("email-key");
  });

  it("defaults JWT_REFRESH_SECRET to JWT_SECRET", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "access-secret",
    });

    const env = await import("./env");

    expect(env.JWT_SECRET).toBe("access-secret");
    expect(env.JWT_REFRESH_SECRET).toBe("access-secret");
  });

  it("defaults APP_URL to localhost in development", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "secret",
    });

    const env = await import("./env");

    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("uses empty APP_URL in production if not provided", async () => {
    setTestEnv({
      NODE_ENV: "production",
      JWT_SECRET: "secret",
      RESEND_API_KEY: "key",
    });

    const env = await import("./env");

    expect(env.APP_URL).toBe("");
  });

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it("throws if NEXT_PUBLIC_APP_URL is not a valid URL", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "secret",
      NEXT_PUBLIC_APP_URL: "not-a-url",
    });

    await expect(import("./env")).rejects.toThrow("Invalid environment variables");
  });

  it("throws if NODE_ENV is invalid", async () => {
    setTestEnv({
      NODE_ENV: "invalid-env" as any,
      JWT_SECRET: "secret",
    });

    await expect(import("./env")).rejects.toThrow("Invalid environment variables");
  });

  // ---------------------------------------------------------------------------
  // JWT_REFRESH_SECRET fallback behavior
  // ---------------------------------------------------------------------------

  it("uses JWT_SECRET when JWT_REFRESH_SECRET is undefined", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "secret",
      JWT_REFRESH_SECRET: undefined,
    });

    const env = await import("./env");

    expect(env.JWT_REFRESH_SECRET).toBe("secret");
  });

  // ---------------------------------------------------------------------------
  // Optional RESEND_API_KEY
  // ---------------------------------------------------------------------------

  it("allows RESEND_API_KEY to be undefined", async () => {
    setTestEnv({
      NODE_ENV: "development",
      JWT_SECRET: "secret",
    });

    const env = await import("./env");

    expect(env.RESEND_API_KEY).toBeUndefined();
  });
});
