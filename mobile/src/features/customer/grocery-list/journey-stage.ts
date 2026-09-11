import type { CustomerGroceryList, GroceryListStatus } from "./types";

// Where the customer is in the write -> send -> get price -> collect journey,
// so the Home card can show their real progress and point at the next step.
export type JourneyStage =
  | { kind: "write" } // nothing on the go - start a list
  | { kind: "send"; count: number } // written but not sent
  | { kind: "pricing"; list: CustomerGroceryList } // sent, shop is pricing
  | { kind: "priced"; list: CustomerGroceryList } // price is in
  | { kind: "packing"; list: CustomerGroceryList } // being packed / packed
  | { kind: "ready"; list: CustomerGroceryList }; // come and collect

// How far along each active status is. Completed and cancelled orders are
// finished, so they are not tracked - the journey starts over at "write".
const PROGRESS: Partial<Record<GroceryListStatus, number>> = {
  received: 1,
  priced: 2,
  packing: 3,
  packed: 4,
  ready: 5,
};

// Pure decision, kept free of React so it can be reasoned about and tested on
// its own. `lists` arrive newest first, as the API returns them.
export function journeyStage(
  draftCount: number,
  lists: CustomerGroceryList[],
): JourneyStage {
  // An unsent list comes first: forgotten, the shop never receives it.
  if (draftCount > 0) return { kind: "send", count: draftCount };

  const active = lists.filter((list) => PROGRESS[list.status] !== undefined);
  if (!active.length) return { kind: "write" };

  // Otherwise follow the most advanced order - the one nearest to needing the
  // customer (a ready order beats one still being priced). On a tie the
  // newest wins, since it comes first.
  const lead = active.reduce((best, list) =>
    (PROGRESS[list.status] ?? 0) > (PROGRESS[best.status] ?? 0) ? list : best,
  );

  switch (lead.status) {
    case "ready":
      return { kind: "ready", list: lead };
    case "packing":
    case "packed":
      return { kind: "packing", list: lead };
    case "priced":
      return { kind: "priced", list: lead };
    default:
      return { kind: "pricing", list: lead };
  }
}
