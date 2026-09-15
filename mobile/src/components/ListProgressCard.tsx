import { Fragment } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import {
  useListJourney,
  type JourneyStage,
} from "@/features/customer/grocery-list/use-list-journey";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { cn, formatPrice } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRIMARY = "#3c5a64";
const MUTED = "#ada291";

// done = finished; current = the customer's move; waiting = the shop's move;
// todo = not reached yet.
type StepState = "done" | "current" | "waiting" | "todo";

// Write -> Send -> Get price -> Collect, lit up to where the customer really is.
const STEP_STATES: Record<JourneyStage["kind"], StepState[]> = {
  write: ["current", "todo", "todo", "todo"],
  send: ["done", "current", "todo", "todo"],
  pricing: ["done", "done", "waiting", "todo"],
  priced: ["done", "done", "done", "waiting"],
  packing: ["done", "done", "done", "waiting"],
  ready: ["done", "done", "done", "current"],
};

function Step({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: StepState;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      {/* Same-size slot for every state, so the labels stay on one line; the
          current step gets a soft halo around its dot. */}
      <View
        className={cn(
          "h-8 w-8 items-center justify-center rounded-full",
          state === "current" && "bg-primary/15",
        )}
      >
        <View
          className={cn(
            "h-6 w-6 items-center justify-center rounded-full",
            state === "done" || state === "current"
              ? "bg-primary"
              : state === "waiting"
                ? "border-2 border-primary bg-card"
                : "border border-border bg-card",
          )}
        >
          {state === "done" ? (
            <Feather name="check" size={13} color="#ffffff" />
          ) : state === "waiting" ? (
            <Feather name="clock" size={12} color={PRIMARY} />
          ) : (
            <Text
              className={cn(
                "text-[11px] font-bold",
                state === "current"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {n}
            </Text>
          )}
        </View>
      </View>
      <Text
        numberOfLines={1}
        className={cn(
          "text-[11px]",
          state === "current"
            ? "font-bold text-primary"
            : state === "todo"
              ? "font-medium text-muted-foreground"
              : "font-semibold text-foreground",
        )}
      >
        {label}
      </Text>
    </View>
  );
}

// The Home screen's lead card: the customer's list journey, live. It shows
// which step they are on - write, send, wait for the price, collect - and
// tapping it goes where that next step happens. It carries no button of its
// own: the centre tab button already opens the list.
export function ListProgressCard() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const openSheet = useGrocerySheetStore((state) => state.open);
  const stage = useListJourney();

  const openLists = () => navigation.navigate("Tabs", { screen: "Lists" });

  // Headline, icon and destination for the stage.
  let icon: keyof typeof MaterialCommunityIcons.glyphMap;
  let title: string;
  let subtitle: string;
  let onPress: () => void;

  switch (stage.kind) {
    case "write":
      icon = "notebook-edit-outline";
      title = t("home.listTitle");
      subtitle = t("home.listSubtitle");
      onPress = openSheet;
      break;
    case "send":
      icon = "send";
      title = t("journey.sendTitle");
      subtitle = t("journey.sendSub", { count: stage.count });
      onPress = openSheet;
      break;
    case "pricing":
      icon = "clock-outline";
      title = t("journey.pricingTitle");
      subtitle = t("journey.pricingSub", { code: stage.list.code });
      onPress = openLists;
      break;
    case "priced":
      icon = "currency-inr";
      title = t("journey.pricedTitle", {
        amount: formatPrice(stage.list.totalAmount),
      });
      subtitle = t("journey.pricedSub", { code: stage.list.code });
      onPress = openLists;
      break;
    case "packing":
      icon = "package-variant";
      title = t(
        stage.list.status === "packed"
          ? "lists.timeline.packed"
          : "lists.timeline.packing",
      );
      subtitle = t("journey.packingSub", { code: stage.list.code });
      onPress = openLists;
      break;
    case "ready":
      icon = "storefront-outline";
      title = t("journey.readyTitle");
      subtitle = t("journey.readySub", { code: stage.list.code });
      onPress = openLists;
      break;
  }

  // Other orders still in progress: mentioned, not followed - tapping the card
  // opens Lists, where all of them are.
  const others = "others" in stage ? stage.others : 0;

  const states = STEP_STATES[stage.kind];
  const labels = [
    t("home.step1"),
    t("home.step2"),
    t("home.step3"),
    t("home.step4"),
  ];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        others > 0
          ? `${title}. ${subtitle}. ${t("journey.moreActive", { count: others })}`
          : `${title}. ${subtitle}`
      }
      className="mx-4 gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-90"
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "h-11 w-11 items-center justify-center rounded-xl",
            // Ready is the one moment the customer must act in person.
            stage.kind === "ready" ? "bg-success" : "bg-primary",
          )}
        >
          <MaterialCommunityIcons name={icon} size={22} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-base font-bold text-foreground"
          >
            {title}
          </Text>
          <Text
            numberOfLines={2}
            className="mt-0.5 text-xs leading-4 text-muted-foreground"
          >
            {subtitle}
          </Text>
          {others > 0 ? (
            <Text
              numberOfLines={1}
              className="mt-0.5 text-xs font-semibold text-primary"
            >
              {t("journey.moreActive", { count: others })}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color={MUTED} />
      </View>

      {/* Write -> Send -> Get price -> Collect */}
      {/* Steps are equal-width siblings with fixed-size arrows between them,
          so all four sit evenly whatever their state. */}
      <View className="flex-row items-center rounded-xl bg-secondary px-1.5 py-2">
        {states.map((state, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <Feather
                name="chevron-right"
                size={13}
                // The arrow into a step lights up once the step before it is done.
                color={states[i - 1] === "done" ? PRIMARY : MUTED}
              />
            ) : null}
            <Step n={i + 1} label={labels[i]} state={state} />
          </Fragment>
        ))}
      </View>
    </Pressable>
  );
}
