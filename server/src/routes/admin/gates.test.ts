/**
 * Every admin route is gated, and no gate reaches past its own router.
 *
 * @remarks
 * This file reads the route sources as text rather than importing them, which
 * is unusual and deliberate: the property it checks is about how the routers
 * are *written*, and it must hold for a route nobody thought to test.
 *
 * It exists because of a bug that reached production. Six routers each applied
 * `router.use(requireAdmin)`, and all of them are mounted on the same `/admin`
 * prefix. Express runs `router.use` middleware for every request that enters
 * the router, including paths that belong to a different router entirely - so
 * the product router, mounted first, refused the shop's staff on
 * `/admin/grocery-lists`, a path it has never heard of. The staff member got
 * "Admin access only" from a gate that was not even supposed to look at them,
 * and the request never reached the permission it would have passed.
 *
 * Both assertions below would have failed on that code.
 *
 * @packageDocumentation
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ADMIN_DIR = join(__dirname);

/**
 * The file with its comments removed.
 *
 * These assertions are about what executes. A doc comment that mentions
 * `requireAdmin` while explaining the history is prose, not a gate.
 *
 * @param source - The file's text.
 * @returns The same text with block and line comments blanked out.
 */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Every admin route module, by file name. */
const routeFiles = readdirSync(ADMIN_DIR).filter(
  (name) => name.endsWith(".routes.ts"),
);

/** `adminThingRouter.get(` / `.post(` / `.patch(` / `.put(` / `.delete(` */
const ROUTE_DECLARATION = /^\s*\w*[Rr]outer\s*\.\s*(get|post|put|patch|delete)\s*\(/gm;

/** A router-wide middleware: the construct that caused the bug. */
const ROUTER_WIDE_USE = /^\s*\w*[Rr]outer\s*\.\s*use\s*\(/gm;

describe("the admin routers", () => {
  it("has route files to check, so a rename cannot make this vacuous", () => {
    expect(routeFiles.length).toBeGreaterThan(5);
  });

  it.each(routeFiles)("%s gates every one of its routes", (name) => {
    const source = codeOnly(readFileSync(join(ADMIN_DIR, name), "utf8"));
    const routes = source.match(ROUTE_DECLARATION) ?? [];
    const gates = source.match(/requirePermission\(/g) ?? [];

    // One gate per route, each naming the permission that route needs.
    expect(gates.length, `${name}: ${routes.length} routes, ${gates.length} gates`).toBe(
      routes.length,
    );
  });

  it.each(routeFiles)("%s applies no router-wide middleware", (name) => {
    const source = codeOnly(readFileSync(join(ADMIN_DIR, name), "utf8"));
    const wide = source.match(ROUTER_WIDE_USE) ?? [];

    // Every admin router shares the "/admin" mount, so `router.use` here runs
    // for other routers' paths too. Gate each route instead.
    expect(wide, `${name} uses router-wide middleware: ${wide.join(", ")}`).toEqual(
      [],
    );
  });

  it("never falls back to the old blanket admin gate", () => {
    for (const name of routeFiles) {
      const source = codeOnly(readFileSync(join(ADMIN_DIR, name), "utf8"));
      expect(source.includes("requireAdmin"), `${name} imports requireAdmin`).toBe(
        false,
      );
    }
  });
});
