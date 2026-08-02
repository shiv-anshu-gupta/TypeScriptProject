import { Dimensions, ScrollView, TextInput, View, Text } from "react-native";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useSendDraft } from "@/features/customer/draft-list/use-send-draft";
import { Button } from "@/components/ui/Button";
import { PhonePrompt } from "@/components/PhonePrompt";

// Let the paper take most of the screen but leave a peek of the section
// below so the user knows the page scrolls further.
const LIST_MAX_HEIGHT = Math.round(Dimensions.get("window").height * 0.6);

export function GroceryList() {
  // The paper is a view over the shared draft — the same draft that
  // "Add to list" on catalog products writes into.
  const rows = useDraftListStore((state) => state.rows);
  const updateRow = useDraftListStore((state) => state.updateRow);

  const {
    filledRows,
    submitting,
    send,
    phonePromptOpen,
    closePhonePrompt,
    submitWithPhone,
  } = useSendDraft();

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
          onPress={() => void send()}
        />
        <Text className="text-center text-xs text-muted-foreground">
          The shop will price your list and send it back.
        </Text>
      </View>

      <PhonePrompt
        open={phonePromptOpen}
        submitting={submitting}
        onClose={closePhonePrompt}
        onSubmit={submitWithPhone}
      />
    </View>
  );
}
