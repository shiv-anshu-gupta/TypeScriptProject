/**
 * Where an order is, as a row of numbered steps across the top of its card.
 *
 * @packageDocumentation
 */

import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { GroceryListStatus } from "@/features/customer/grocery-list/types";

/**
 * The four steps a customer sees.
 *
 * @remarks
 * The server has five live statuses; "packing" and "packed" share one step,
 * because five labels do not fit across a phone without being cut, and the
 * line under the stepper already says which of the two it is.
 */
export const ORDER_STEPS = ["received", "priced", "packing", "ready"] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

export type StepState = "complete" | "current" | "upcoming";

/** Which step each status has reached. `completed` is past the last one. */
const REACHED: Record<Exclude<GroceryListStatus, "cancelled">, number> = {
  received: 0,
  priced: 1,
  packing: 2,
  packed: 2,
  ready: 3,
  completed: ORDER_STEPS.length,
};

/**
 * The state of every step for a status, or `null` for a cancelled order,
 * which has no position on the journey.
 *
 * @remarks
 * The step the order has reached is `current`; steps before it are
 * `complete`; steps after it are `upcoming`. A completed order has every
 * step complete and none current.
 */
export function stepStates(status: GroceryListStatus): StepState[] | null {
  if (status === "cancelled") return null;
  const reached = REACHED[status] ?? 0;
  return ORDER_STEPS.map((_, index) =>
    index < reached ? "complete" : index === reached ? "current" : "upcoming",
  );
}

const PRIMARY = "#3c5a64";
const BORDER = "#e6dcc9";

/** The thin chevron between two steps, drawn to the full height of the row. */
function Chevron() {
  return (
    <View pointerEvents="none" className="absolute bottom-0 right-0 top-0 w-2.5">
      <Svg width="100%" height="100%" viewBox="0 0 22 80" preserveAspectRatio="none">
        <Path
          d="M0 -2L20 40L0 82"
          stroke={BORDER}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </View>
  );
}

/** The numbered circle: filled with a tick, outlined in colour, or grey. */
function Marker({ state, number }: { state: StepState; number: number }) {
  if (state === "complete") {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Feather name="check" size={16} color="#ffffff" />
      </View>
    );
  }
  const current = state === "current";
  return (
    <View
      className={
        current
          ? "h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-card"
          : "h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card"
      }
    >
      <Text
        className={
          current ? "text-xs font-bold text-primary" : "text-xs font-semibold text-muted-foreground"
        }
      >
        {String(number).padStart(2, "0")}
      </Text>
    </View>
  );
}

/**
 * The stepper itself.
 *
 * @remarks
 * Renders nothing for a cancelled order; the card shows its own banner then.
 * Each step is one accessibility element read as "Step 2 of 4, Priced, done",
 * so a screen reader hears the journey rather than four loose numbers.
 */
export function OrderStepper({ status }: { status: GroceryListStatus }) {
  const { t } = useTranslation();
  const states = stepStates(status);
  if (!states) return null;

  return (
    <View
      className="flex-row overflow-hidden rounded-xl border border-border bg-card"
      accessibilityRole="progressbar"
    >
      {ORDER_STEPS.map((step, index) => {
        const state = states[index];
        const current = state === "current";
        const label = t(`lists.steps.${step}`);
        const stateLabel = t(`lists.stepState.${state}`);

        return (
          <View
            key={step}
            className="relative flex-1 items-center gap-1.5 px-1 pb-3 pt-3"
            accessible
            accessibilityLabel={t("lists.stepA11y", {
              number: index + 1,
              total: ORDER_STEPS.length,
              label,
              state: stateLabel,
            })}
          >
            <Marker state={state} number={index + 1} />
            <Text
              className={
                current
                  ? "text-[10px] font-semibold uppercase text-primary"
                  : "text-[10px] font-medium uppercase text-muted-foreground"
              }
              numberOfLines={1}
            >
              {stateLabel}
            </Text>
            <Text
              className={
                state === "upcoming"
                  ? "text-center text-xs font-medium leading-4 text-muted-foreground"
                  : current
                    ? "text-center text-xs font-bold leading-4 text-primary"
                    : "text-center text-xs font-semibold leading-4 text-foreground"
              }
              numberOfLines={2}
            >
              {label}
            </Text>

            {/* The step the order is on carries a bar along its foot. */}
            {current ? (
              <View
                className="absolute bottom-0 left-2 right-3 h-0.5 rounded-full"
                style={{ backgroundColor: PRIMARY }}
              />
            ) : null}
            {index < ORDER_STEPS.length - 1 ? <Chevron /> : null}
          </View>
        );
      })}
    </View>
  );
}
