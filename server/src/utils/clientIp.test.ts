/**
 * The address the shop-network gate is allowed to believe.
 *
 * The attack this defends against is cheap and obvious: a staff member at home
 * sends `X-Forwarded-For: <the shop's IP>` and asks to be let in. Every test
 * below is a version of that.
 *
 * @packageDocumentation
 */
import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, sameNetwork } from "./clientIp";

/** The shop's real address, as the platform would report it. */
const SHOP = "49.36.180.22";
/** A staff member's home broadband. */
const HOME = "103.21.58.7";

describe("reading the caller's address", () => {
  it("believes the platform's own header first", () => {
    const ip = clientIpFromHeaders({
      "x-vercel-forwarded-for": HOME,
      "x-forwarded-for": `${SHOP}, ${HOME}`,
      "x-real-ip": HOME,
    });
    expect(ip).toBe(HOME);
  });

  it("takes the LAST hop of x-forwarded-for, never the first", () => {
    // A forged value can only ever be prepended: the proxy appends the address
    // it actually saw. So the rightmost entry is the one nobody chose.
    expect(clientIpFromHeaders({ "x-forwarded-for": `${SHOP}, ${HOME}` })).toBe(
      HOME,
    );
  });

  it("ignores a forged header when the platform reports the truth", () => {
    const forged = {
      "x-forwarded-for": SHOP,
      "x-real-ip": HOME,
    };
    expect(clientIpFromHeaders(forged)).toBe(HOME);
    expect(clientIpFromHeaders(forged)).not.toBe(SHOP);
  });

  it("accepts a header array, as Node may hand one over", () => {
    expect(
      clientIpFromHeaders({ "x-forwarded-for": [`${SHOP}, ${HOME}`] }),
    ).toBe(HOME);
  });

  it("normalises an IPv4-mapped IPv6 address", () => {
    expect(clientIpFromHeaders({ "x-real-ip": `::ffff:${HOME}` })).toBe(HOME);
  });

  it("strips a port", () => {
    expect(clientIpFromHeaders({ "x-real-ip": `${HOME}:54321` })).toBe(HOME);
  });

  it("returns null rather than a guess when it has nothing", () => {
    expect(clientIpFromHeaders({})).toBeNull();
    expect(clientIpFromHeaders({ "x-forwarded-for": "" })).toBeNull();
    expect(clientIpFromHeaders({ "x-forwarded-for": " , " })).toBeNull();
    expect(clientIpFromHeaders({ "x-real-ip": "not-an-ip" })).toBeNull();
  });
});

describe("matching against the shop's registered networks", () => {
  it("lets a caller in only on an exact match", () => {
    expect(sameNetwork(SHOP, [SHOP, "1.2.3.4"])).toBe(true);
    expect(sameNetwork(HOME, [SHOP, "1.2.3.4"])).toBe(false);
  });

  it("refuses when the address could not be read", () => {
    expect(sameNetwork(null, [SHOP])).toBe(false);
  });

  it("refuses when no network has been registered yet", () => {
    // Fail closed: an empty list must lock staff out, not let everyone in.
    expect(sameNetwork(SHOP, [])).toBe(false);
  });
});
