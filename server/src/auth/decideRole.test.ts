/**
 * Who gets which role at sign-in.
 *
 * @packageDocumentation
 */
import { describe, expect, it } from "vitest";
import { decideRole, type RoleInput } from "./decideRole";

/** A verified customer with no grant of any kind. */
const BASE: RoleInput = {
  email: "someone@example.com",
  emailVerified: true,
  isAdminEmail: false,
  isStaffEmail: false,
  currentRole: "user",
};

describe("granting a role", () => {
  it("makes an admin only from ADMIN_EMAILS", () => {
    expect(decideRole({ ...BASE, isAdminEmail: true })).toBe("admin");
  });

  it("makes a staff member from the shop's roster", () => {
    expect(decideRole({ ...BASE, isStaffEmail: true })).toBe("staff");
  });

  it("leaves everyone else a customer", () => {
    expect(decideRole(BASE)).toBe("user");
  });

  it("prefers admin when an address is on both lists", () => {
    expect(
      decideRole({ ...BASE, isAdminEmail: true, isStaffEmail: true }),
    ).toBe("admin");
  });
});

describe("an unverified email", () => {
  // The attack: sign up claiming the shopkeeper's address, without ever
  // proving you can read mail sent to it.
  it("cannot become an admin", () => {
    expect(
      decideRole({ ...BASE, emailVerified: false, isAdminEmail: true }),
    ).toBe("user");
  });

  it("cannot become staff", () => {
    expect(
      decideRole({ ...BASE, emailVerified: false, isStaffEmail: true }),
    ).toBe("user");
  });

  it("cannot be elevated even with no email at all", () => {
    expect(
      decideRole({
        ...BASE,
        email: null,
        emailVerified: true,
        isAdminEmail: true,
      }),
    ).toBe("user");
  });
});

describe("taking a role away", () => {
  it("demotes a staff member dropped from the roster", () => {
    expect(decideRole({ ...BASE, currentRole: "staff", isStaffEmail: false })).toBe(
      "user",
    );
  });

  it("keeps a staff member who is still on it", () => {
    expect(decideRole({ ...BASE, currentRole: "staff", isStaffEmail: true })).toBe(
      "staff",
    );
  });

  it("never demotes an existing admin", () => {
    // Long-standing behaviour, kept deliberately: a typo in ADMIN_EMAILS must
    // not lock the shopkeeper out of their own shop.
    expect(
      decideRole({ ...BASE, currentRole: "admin", isAdminEmail: false }),
    ).toBe("admin");
    expect(
      decideRole({
        ...BASE,
        currentRole: "admin",
        isAdminEmail: false,
        emailVerified: false,
      }),
    ).toBe("admin");
  });

  it("promotes a staff member who is added to ADMIN_EMAILS", () => {
    expect(
      decideRole({ ...BASE, currentRole: "staff", isAdminEmail: true }),
    ).toBe("admin");
  });
});
