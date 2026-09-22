/**
 * The permission table, asserted in full.
 *
 * Every role is checked against every permission - not the handful someone
 * remembered - so widening what staff may do cannot happen quietly. If you
 * meant to widen it, this file is the second place you edit, and the diff says
 * exactly what changed.
 *
 * @packageDocumentation
 */
import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  can,
  canSeeCustomerContact,
  requiresShopNetwork,
  ROLE_PERMISSIONS,
  type Permission,
  type UserRole,
} from "./permissions";

/**
 * What staff is allowed to do, written out again here on purpose.
 *
 * Importing the same constant the implementation uses would make this test
 * agree with any change automatically, which is the opposite of what it is for.
 */
const STAFF_MAY: readonly Permission[] = [
  "lists:read",
  "lists:price",
  "lists:availability",
  "lists:chat",
];

const ROLES: readonly UserRole[] = ["user", "staff", "admin"];

describe("the permission table", () => {
  it("grants a customer nothing at all", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can("user", permission), permission).toBe(false);
    }
  });

  it("grants staff exactly the four pricing permissions", () => {
    for (const permission of ALL_PERMISSIONS) {
      const expected = STAFF_MAY.includes(permission);
      expect(can("staff", permission), permission).toBe(expected);
    }
    expect(ROLE_PERMISSIONS.staff.size).toBe(STAFF_MAY.length);
  });

  it("keeps money, deletion and the shop's own numbers away from staff", () => {
    const forbidden: Permission[] = [
      "lists:markPaid",
      "lists:status",
      "lists:addItem",
      "lists:editItem",
      "dashboard:read",
      "products:manage",
      "promos:manage",
      "settings:manage",
      "staff:manage",
      "network:manage",
      "audit:read",
    ];
    for (const permission of forbidden) {
      expect(can("staff", permission), permission).toBe(false);
    }
  });

  it("grants the shopkeeper everything, with nothing left undecided", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can("admin", permission), permission).toBe(true);
    }
    expect(ROLE_PERMISSIONS.admin.size).toBe(ALL_PERMISSIONS.length);
  });

  it("lists every permission that exists, so this file cannot go stale", () => {
    const declared = new Set(ALL_PERMISSIONS);
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(declared.has(permission), `${role} holds ${permission}`).toBe(
          true,
        );
      }
    }
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it("refuses an unknown role rather than guessing", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can("owner", permission), permission).toBe(false);
      expect(can("", permission), permission).toBe(false);
    }
  });
});

describe("the shop-network gate", () => {
  it("applies to staff and to nobody else", () => {
    expect(requiresShopNetwork("staff")).toBe(true);
    expect(requiresShopNetwork("admin")).toBe(false);
    expect(requiresShopNetwork("user")).toBe(false);
    expect(requiresShopNetwork("owner")).toBe(false);
  });
});

describe("the customer's contact details", () => {
  it("are for the shopkeeper only", () => {
    expect(canSeeCustomerContact("admin")).toBe(true);
    expect(canSeeCustomerContact("staff")).toBe(false);
    expect(canSeeCustomerContact("user")).toBe(false);
  });
});
