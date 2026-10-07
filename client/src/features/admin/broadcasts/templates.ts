/**
 * Labels and ready-made ideas for the broadcast composer.
 *
 * @packageDocumentation
 */
import type { BroadcastTargetType } from "./api";

/** What each target is called on screen, in the order the select lists them. */
export const TARGET_OPTIONS: { type: BroadcastTargetType; label: string }[] = [
  { type: "writeList", label: "Write a list" },
  { type: "home", label: "Home" },
  { type: "products", label: "Products" },
  { type: "category", label: "A category…" },
  { type: "product", label: "A product…" },
];

/** Short label for a target type, used in the history table. */
export const TARGET_SHORT_LABEL: Record<BroadcastTargetType, string> = {
  writeList: "Write a list",
  home: "Home",
  products: "Products",
  category: "Category",
  product: "Product",
};

/** A starting point the shopkeeper can click and then edit. */
export type BroadcastIdea = {
  title: string;
  body: string;
  target: "writeList" | "home" | "products";
};

/**
 * Six ideas, Hindi first.
 *
 * @remarks
 * Every one is something the shop can honestly stand behind: no countdowns, no
 * invented discounts, nothing that pretends an order is waiting. Customers who
 * feel tricked turn notifications off, and then order updates stop reaching
 * them too.
 */
export const BROADCAST_IDEAS: BroadcastIdea[] = [
  {
    title: "दिवाली की सूची तैयार? 🪔",
    body: "घी, मेवा, चीनी, तेल - अपनी सूची भेजिए, दाम हम बताएँगे।",
    target: "writeList",
  },
  {
    title: "नया सामान आया है 🛒",
    body: "दुकान में नए products आए हैं। एक नज़र डालिए।",
    target: "products",
  },
  {
    title: "हफ़्ते का राशन? 📝",
    body: "पिछली बार वाली सूची एक tap में फिर भेजिए।",
    target: "home",
  },
  {
    title: "बारिश के मौसम की तैयारी ☔",
    body: "चाय, बिस्कुट, मैगी - सूची भेजिए, सामान तैयार मिलेगा।",
    target: "writeList",
  },
  {
    title: "आज दुकान पर भीड़ है? 😊",
    body: "लाइन में मत लगिए - सूची app से भेजिए, आकर सामान ले जाइए।",
    target: "writeList",
  },
  {
    title: "त्योहार की ख़रीदारी 🎉",
    body: "पूजा का सामान, मिठाई का सामान - सूची भेजिए, हम तैयार रखेंगे।",
    target: "writeList",
  },
];
