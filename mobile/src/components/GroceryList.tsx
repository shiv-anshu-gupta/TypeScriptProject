import { useRef, useState } from "react";
import { Dimensions, ScrollView, TextInput, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

// Let the paper take most of the screen but leave a peek of the section
// below so the user knows the page scrolls further.
const LIST_MAX_HEIGHT = Math.round(Dimensions.get("window").height * 0.6);

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GroceryRow = {
  id: number;
  name: string;
  quantity: string;
};

const INITIAL_ROWS = 20;

function makeInitialRows(): GroceryRow[] {
  return Array.from({ length: INITIAL_ROWS }, (_, index) => ({
    id: index + 1,
    name: "",
    quantity: "",
  }));
}

export function GroceryList() {
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();

  const submitting = useCustomerGroceryListStore((state) => state.submitting);
  const submitList = useCustomerGroceryListStore((state) => state.submitList);

  const [rows, setRows] = useState<GroceryRow[]>(makeInitialRows);
  const nextId = useRef(INITIAL_ROWS + 1);

  const filledRows = rows.filter((row) => (row.name ?? "").trim().length > 0);

  const updateRow = (id: number, key: "name" | "quantity", value: string) => {
    setRows((prev) => {
      let next = prev.map((row) =>
        row.id === id ? { ...row, [key]: value } : row,
      );

      // Keep a trailing blank line so the "paper" grows as items are added.
      const last = next[next.length - 1];
      if (
        (last.name ?? "").trim() !== "" ||
        (last.quantity ?? "").trim() !== ""
      ) {
        next = [...next, { id: nextId.current++, name: "", quantity: "" }];
      }

      return next;
    });
  };

  const onSend = async () => {
    if (!filledRows.length) {
      toast.error("Write at least one item");
      return;
    }

    if (!isSignedIn) {
      toast.error("Sign in to send your list");
      navigation.navigate("SignIn");
      return;
    }

    const sent = await submitList({
      items: filledRows.map((row) => ({
        name: row.name.trim(),
        quantity: (row.quantity ?? "").trim(),
      })),
    });

    if (sent) {
      setRows(makeInitialRows());
      nextId.current = INITIAL_ROWS + 1;
      navigation.navigate("Tabs", { screen: "Lists" });
    }
  };

  return (
    <View className="gap-3">
      {/* Cream "paper" sheet with a soft shadow. */}
      <View
        className="mx-3 overflow-hidden rounded-md bg-[#fdf8ea]"
        style={{
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <ScrollView
          style={{ maxHeight: LIST_MAX_HEIGHT }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row, index) => (
            // Each line = a ruled row with a red left margin, like a rough copy.
            <View
              key={row.id}
              className="h-11 flex-row items-center border-b border-[#c9d9ea]"
            >
              <Text className="w-8 text-right text-xs text-[#a89b78]">
                {index + 1}
              </Text>
              {/* red margin line */}
              <View className="ml-2 h-full w-px bg-[#e3a89b]" />

              {/* Item name — 3/4 of the writing area */}
              <TextInput
                value={row.name ?? ""}
                onChangeText={(text) => updateRow(row.id, "name", text)}
                placeholder=""
                style={{ flex: 3 }}
                className="h-full px-3 text-base text-[#26303a]"
              />

              {/* divider between name and quantity */}
              <View className="h-full w-px bg-[#c9d9ea]" />

              {/* Quantity — 1/4 of the writing area */}
              <TextInput
                value={row.quantity ?? ""}
                onChangeText={(text) => updateRow(row.id, "quantity", text)}
                placeholder=""
                style={{ flex: 1 }}
                className="h-full px-3 text-base text-[#26303a]"
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="mx-3 gap-2">
        <Button
          label={
            filledRows.length
              ? `Send ${filledRows.length} item${filledRows.length > 1 ? "s" : ""} to shop`
              : "Send list to shop"
          }
          loading={submitting}
          disabled={!filledRows.length}
          onPress={() => void onSend()}
        />
        <Text className="text-center text-xs text-muted-foreground">
          The shop will price your list and send it back.
        </Text>
      </View>
    </View>
  );
}
