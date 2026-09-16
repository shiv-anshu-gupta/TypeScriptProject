import { countSendableRows, useDraftListStore } from "../draft-list/store";
import { useCustomerGroceryListStore } from "./store";
import { journeyStage, type JourneyStage } from "./journey-stage";

export type { JourneyStage };

// The customer's current journey stage, live from the draft and their orders.
// The rule itself lives in journeyStage().
export function useListJourney(): JourneyStage {
  const draftCount = useDraftListStore((state) =>
    countSendableRows(state.rows),
  );
  const lists = useCustomerGroceryListStore((state) => state.items);
  return journeyStage(draftCount, lists);
}
