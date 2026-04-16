import { describe, it, expect, vi, afterEach } from "vitest";

const ORIGINAL_ENV = process.env;

let connectMock: ReturnType<typeof vi.fn>;

vi.mock("mongodb", () => {
  connectMock = vi.fn();
  return {
    MongoClient: { connect: connectMock },
  };
});

function setTestEnv(env: NodeJS.ProcessEnv) {
  process.env = {
    ...ORIGINAL_ENV,
    ...env,
  };
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.resetModules();
  vi.clearAllMocks();
});

describe("getDb", () => {
  it("throws when PERSISTENCE_DRIVER is not 'mongo'", async () => {
    setTestEnv({
      NODE_ENV: "test",
      JWT_SECRET: "secret",
      PERSISTENCE_DRIVER: "memory",
    });

    const { getDb } = await import("./mongoClient");

    await expect(getDb()).rejects.toThrow("getDb() called but PERSISTENCE_DRIVER is not 'mongo'");
  });

  it("connects using MongoClient when configuration is valid", async () => {
    setTestEnv({
      NODE_ENV: "test",
      JWT_SECRET: "secret",
      PERSISTENCE_DRIVER: "mongo",
      MONGODB_URI: "mongodb://localhost:27017",
      MONGODB_DB_NAME: "testdb",
    });

    connectMock.mockResolvedValue({
      db: vi.fn().mockReturnValue({ name: "testdb" }),
    });

    const { getDb } = await import("./mongoClient");

    const db = await getDb();

    expect(connectMock).toHaveBeenCalledWith("mongodb://localhost:27017");
    expect(db).toEqual({ name: "testdb" });
  });
});
