import { ACTIVE_STATUSES, type CustomerGroceryList } from "./types";

// Where the customer is in the write -> send -> get price -> collect journey,
// so the Home card can show their real progress and point at the next step.
// `others` counts the customer's other orders still in progress, so the card
// can mention them without following them.
export type JourneyStage =
  | { kind: "write" } // nothing on the go - start a list
  | { kind: "send"; count: number } // written but not sent
  | { kind: "pricing"; list: CustomerGroceryList; others: number } // sent, shop is pricing
  | { kind: "priced"; list: CustomerGroceryList; others: number } // price is in
  | { kind: "packing"; list: CustomerGroceryList; others: number } // being packed / packed
  | { kind: "ready"; list: CustomerGroceryList; others: number }; // come and collect

// Orders still in progress, from the one shared list (types.ts) that the
// Lists "Active" tab uses too. Completed and cancelled orders are finished, so
// they are not tracked - with none left the journey starts over at "write".
const ACTIVE: ReadonlySet<string> = new Set(ACTIVE_STATUSES);

// Pure decision, kept free of React so it can be reasoned about and tested on
// its own.
export function journeyStage(
  draftCount: number,
  lists: CustomerGroceryList[],
): JourneyStage {
  // An unsent list comes first: forgotten, the shop never receives it.
  if (draftCount > 0) return { kind: "send", count: draftCount };

  // Newest first. Sorted here rather than trusting the order lists arrive in.
  const active = lists
    .filter((list) => ACTIVE.has(list.status))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  if (!active.length) return { kind: "write" };

  // A ready order needs the customer in person, so it always leads (the
  // newest one if several are ready). Otherwise the card follows the newest
  // order - the one the customer last sent - not the one furthest along: an
  // old order left unfinished must never hide the list they just sent.
  const lead = active.find((list) => list.status === "ready") ?? active[0];
  const others = active.length - 1;

  switch (lead.status) {
    case "ready":
      return { kind: "ready", list: lead, others };
    case "packing":
    case "packed":
      return { kind: "packing", list: lead, others };
    case "priced":
      return { kind: "priced", list: lead, others };
    default:
      return { kind: "pricing", list: lead, others };
  }
}
