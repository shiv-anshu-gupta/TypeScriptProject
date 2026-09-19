/**
 * The journey decision, wired to live state.
 *
 * @packageDocumentation
 */

import { countSendableRows, useDraftListStore } from "../draft-list/store";
import { useCustomerGroceryListStore } from "./store";
import { journeyStage, type JourneyStage } from "./journey-stage";

export type { JourneyStage };

/**
 * The customer's current journey stage, live from the draft and their orders.
 * The rule itself lives in journeyStage().
 *
 * @remarks
 * Re-renders whenever the draft count or the list of orders changes, so the
 * Home card follows a list being typed without any refresh of its own.
 *
 * It reads both stores but fetches nothing. A signed-out customer has no
 * orders loaded, so the answer comes from the draft alone.
 */
export function useListJourney(): JourneyStage {
  const draftCount = useDraftListStore((state) =>
    countSendableRows(state.rows),
  );
  const lists = useCustomerGroceryListStore((state) => state.items);
  return journeyStage(draftCount, lists);
}
