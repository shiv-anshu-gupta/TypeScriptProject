/**
 * The gate, exercised over real HTTP.
 *
 * @remarks
 * The unit tests next door prove the rules; this file proves the wiring. It
 * mounts the actual middleware in an actual Express app and sends actual
 * requests, because the questions worth answering here are about the whole
 * round trip: does a staff member get 403 on the dashboard, does a forged
 * header get them in from home, and does a role change take effect without a
 * new sign-in.
 *
 * Clerk and MongoDB are replaced, not started. The gate's three dependencies -
 * who is calling, which networks are registered, and the audit trail - are the
 * seams, and none of them is what is under test.
 *
 * @packageDocumentation
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The address the shop registered. */
const SHOP_IP = "49.36.180.22";
/** A staff member's home broadband. */
const HOME_IP = "103.21.58.7";

/** Whoever the next request will be authenticated as. */
let signedInAs: { _id: string; email: string; role: string } | null = null;
/** What the shop currently has registered. */
let networks: string[] = [SHOP_IP];

vi.mock("./auth", () => ({
  getDbUserFromReq: vi.fn(async () => {
    if (!signedInAs) throw Object.assign(new Error("not signed in"), { statusCode: 401 });
    return signedInAs;
  }),
}));

vi.mock("../models/ShopNetwork", () => ({
  ShopNetworkModel: {
    find: () => ({ lean: async () => networks.map((ip) => ({ ip })) }),
    updateOne: async () => ({}),
  },
}));

const denials: string[] = [];
vi.mock("../services/audit", () => ({
  recordAudit: async () => {},
  recordOffNetworkDenial: async (_req: unknown, ip: string) => {
    denials.push(ip);
  },
}));

const { forgetNetworkCache, requirePermission } = await import(
  "./requirePermission"
);

/**
 * An app with one route per permission under test, and the real error handler
 * shape: an `AppError` carries `statusCode`.
 */
function buildApp() {
  const app = express();
  app.get("/lists", requirePermission("lists:read"), (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/dashboard", requirePermission("dashboard:read"), (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/staff", requirePermission("staff:manage"), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(
    (
      error: { statusCode?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(error.statusCode ?? 500).json({ message: error.message });
    },
  );
  return app;
}

const app = buildApp();

/** Sends a request as if it arrived from `ip`, the way the platform reports it. */
function from(path: string, ip: string) {
  return request(app).get(path).set("x-real-ip", ip);
}

beforeEach(() => {
  networks = [SHOP_IP];
  denials.length = 0;
  forgetNetworkCache();
});

afterEach(() => {
  signedInAs = null;
});

describe("a staff member, inside the shop", () => {
  beforeEach(() => {
    signedInAs = { _id: "1", email: "raju@example.com", role: "staff" };
  });

  it("can open the lists", async () => {
    const res = await from("/lists", SHOP_IP);
    expect(res.status).toBe(200);
  });

  it("cannot open the dashboard", async () => {
    const res = await from("/dashboard", SHOP_IP);
    expect(res.status).toBe(403);
  });

  it("cannot manage staff", async () => {
    const res = await from("/staff", SHOP_IP);
    expect(res.status).toBe(403);
  });
});

describe("a staff member, somewhere else", () => {
  beforeEach(() => {
    signedInAs = { _id: "1", email: "raju@example.com", role: "staff" };
  });

  it("is refused, and told why", async () => {
    const res = await from("/lists", HOME_IP);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("OFF_SHOP_NETWORK");
  });

  it("is recorded, so the shopkeeper can see it happened", async () => {
    await from("/lists", HOME_IP);
    expect(denials).toEqual([HOME_IP]);
  });

  it("cannot forge the shop's address with a header", async () => {
    // The platform appends the address it saw, so the forged value can only be
    // prepended - and the gate reads from the right.
    const res = await request(app)
      .get("/lists")
      .set("x-forwarded-for", `${SHOP_IP}, ${HOME_IP}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("OFF_SHOP_NETWORK");
  });

  it("is refused when the shop has registered nothing at all", async () => {
    networks = [];
    forgetNetworkCache();
    const res = await from("/lists", SHOP_IP);
    expect(res.status).toBe(403);
  });
});

describe("the shopkeeper", () => {
  beforeEach(() => {
    signedInAs = { _id: "2", email: "owner@example.com", role: "admin" };
  });

  it("works from home, because the gate is for staff", async () => {
    expect((await from("/lists", HOME_IP)).status).toBe(200);
    expect((await from("/dashboard", HOME_IP)).status).toBe(200);
    expect((await from("/staff", HOME_IP)).status).toBe(200);
  });
});

describe("a customer who signs into the panel", () => {
  it("gets nothing, from anywhere", async () => {
    signedInAs = { _id: "3", email: "grahak@example.com", role: "user" };
    expect((await from("/lists", SHOP_IP)).status).toBe(403);
    expect((await from("/dashboard", SHOP_IP)).status).toBe(403);
  });
});

describe("revoking access", () => {
  it("takes effect on the next request, with no new sign-in", async () => {
    signedInAs = { _id: "1", email: "raju@example.com", role: "staff" };
    expect((await from("/lists", SHOP_IP)).status).toBe(200);

    // The shopkeeper removes them; the User document is what changes.
    signedInAs = { _id: "1", email: "raju@example.com", role: "user" };
    expect((await from("/lists", SHOP_IP)).status).toBe(403);
  });
});

describe("the 403 for a wrong role", () => {
  it("says the same thing as the old admin-only gate, so it reveals nothing", async () => {
    signedInAs = { _id: "1", email: "raju@example.com", role: "staff" };
    const res = await from("/dashboard", SHOP_IP);
    expect(res.body.message).toBe("Admin access only");
  });
});
