/**
 * What a staff member's browser is allowed to receive.
 *
 * These tests assert absence, which is the whole point: hiding a phone number
 * in the UI proves nothing, because the response is one devtools tab away. The
 * assertions are written against the serialised JSON - the actual bytes on the
 * wire - rather than against object properties, so a value that survives in a
 * nested field still fails.
 *
 * @packageDocumentation
 */
import { describe, expect, it } from "vitest";
import { listForRole, conversationForRole } from "./listForRole";

/** A list as `mapGroceryList` builds it, for a customer who gave a name. */
const NAMED = {
  _id: "68f0000000000000000000aa",
  code: "000000AA",
  customerName: "Ramesh Kumar",
  customerEmail: "ramesh@example.com",
  customerPhone: "9876543210",
  items: [{ name: "Aata", quantity: "5 kg", rate: 0, price: 0 }],
  totalItems: 1,
  totalAmount: 0,
  status: "received",
};

/**
 * The same, for a customer who never set a name.
 *
 * `mapGroceryList` falls back to the email address in that case, so the email
 * arrives inside `customerName`. Dropping the `customerEmail` key alone would
 * ship it anyway.
 */
const UNNAMED = { ...NAMED, customerName: "ramesh@example.com" };

/** Every string value anywhere in the payload, as the wire would carry it. */
function wire(value: unknown): string {
  return JSON.stringify(value);
}

describe("a list on its way to staff", () => {
  it("carries no phone number", () => {
    const sent = listForRole(NAMED, "staff");
    expect(Object.hasOwn(sent, "customerPhone")).toBe(false);
    expect(wire(sent)).not.toContain("9876543210");
  });

  it("carries no email address, in any field", () => {
    const sent = listForRole(NAMED, "staff");
    expect(Object.hasOwn(sent, "customerEmail")).toBe(false);
    expect(wire(sent)).not.toContain("ramesh@example.com");
    expect(wire(sent)).not.toContain("@");
  });

  it("does not leak the email through the name fallback", () => {
    const sent = listForRole(UNNAMED, "staff");
    expect(wire(sent)).not.toContain("ramesh@example.com");
    expect(wire(sent)).not.toContain("@");
  });

  it("keeps a real name, so the counter knows whose order it is", () => {
    const sent = listForRole(NAMED, "staff");
    expect(sent.customerName).toBe("Ramesh Kumar");
  });

  it("keeps everything staff needs to quote", () => {
    const sent = listForRole(NAMED, "staff");
    expect(sent.code).toBe("000000AA");
    expect(sent.items).toHaveLength(1);
    expect(sent.status).toBe("received");
    expect(sent.totalAmount).toBe(0);
  });
});

describe("a list on its way to the shopkeeper", () => {
  it("is untouched", () => {
    const sent = listForRole(NAMED, "admin");
    expect(sent).toEqual(NAMED);
  });
});

describe("a list on its way to anyone else", () => {
  it("is redacted too, because an unknown role is not a trusted one", () => {
    const sent = listForRole(NAMED, "user");
    expect(wire(sent)).not.toContain("9876543210");
    expect(wire(sent)).not.toContain("@");
  });
});

describe("a chat conversation row", () => {
  const ROW = {
    listId: "68f0000000000000000000aa",
    code: "000000AA",
    customerName: "Ramesh Kumar",
    customerPhone: "9876543210",
    lastMessage: "bhaiya aata hai kya",
    unread: 2,
  };

  it("reaches staff without the phone number", () => {
    const sent = conversationForRole(ROW, "staff");
    expect(Object.hasOwn(sent, "customerPhone")).toBe(false);
    expect(wire(sent)).not.toContain("9876543210");
    expect(sent.lastMessage).toBe("bhaiya aata hai kya");
    expect(sent.unread).toBe(2);
  });

  it("reaches the shopkeeper whole", () => {
    expect(conversationForRole(ROW, "admin")).toEqual(ROW);
  });

  it("hides an email that arrived through the name fallback", () => {
    const sent = conversationForRole(
      { ...ROW, customerName: "ramesh@example.com" },
      "staff",
    );
    expect(wire(sent)).not.toContain("@");
  });
});
