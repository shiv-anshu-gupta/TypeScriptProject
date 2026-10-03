/**
 * Which step an order is on, for every status the server can send.
 *
 * @packageDocumentation
 */
import { ORDER_STEPS, stepStates } from "./OrderStepper";

describe("stepStates", () => {
  it("has four steps", () => {
    expect(ORDER_STEPS).toEqual(["received", "priced", "packing", "ready"]);
  });

  it.each([
    ["received", ["current", "upcoming", "upcoming", "upcoming"]],
    ["priced", ["complete", "current", "upcoming", "upcoming"]],
    ["packing", ["complete", "complete", "current", "upcoming"]],
    // packing and packed share a step; the caption tells them apart
    ["packed", ["complete", "complete", "current", "upcoming"]],
    ["ready", ["complete", "complete", "complete", "current"]],
    ["completed", ["complete", "complete", "complete", "complete"]],
  ] as const)("%s", (status, expected) => {
    expect(stepStates(status)).toEqual(expected);
  });

  it("gives a cancelled order no position on the journey", () => {
    expect(stepStates("cancelled")).toBeNull();
  });

  it("never marks more than one step current", () => {
    for (const status of ["received", "priced", "packing", "packed", "ready", "completed"] as const) {
      const current = stepStates(status)!.filter((state) => state === "current");
      expect(current.length).toBeLessThanOrEqual(1);
    }
  });
});
