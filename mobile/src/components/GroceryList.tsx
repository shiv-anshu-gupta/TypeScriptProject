import { TextInput, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useSendDraft } from "@/features/customer/draft-list/use-send-draft";
import { Button } from "@/components/ui/Button";
import { PhonePrompt } from "@/components/PhonePrompt";

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
        {/* Rows render inline — the whole Home page (one FlatList) scrolls, so
            the paper grows without limit and every row stays reachable. A
            nested ScrollView here previously capped it at ~13 rows on Android. */}
        <View>
          {/* Header row */}
          <View className="h-12 flex-row items-center border-b-2 border-[#c9d9ea] bg-[#f5f0e8]">
            <Text className="w-8 text-center text-xs font-bold tracking-wide text-[#8b7a5e]">
              #
            </Text>
            <View className="ml-2 h-6 w-px bg-[#d9a89b]" />
            <Text style={{ flex: 3 }} className="px-3 text-xs font-bold uppercase tracking-widest text-[#3c5a64]">
              Item
            </Text>
            <View className="h-6 w-px bg-[#c9d9ea]/50" />
            <Text style={{ flex: 1 }} className="px-3 text-center text-xs font-bold uppercase tracking-widest text-[#3c5a64]">
              Qty
            </Text>
          </View>
          {rows.map((row, index) => (
            // Each line = a ruled row with a red left margin, like a rough copy.
            <View
              key={row.id}
              className={`h-11 flex-row items-center border-b border-[#c9d9ea] ${
                index % 2 === 0 ? "bg-white" : "bg-[#fdfbf7]"
              }`}
            >
              <Text className="w-8 text-center text-xs font-medium text-[#a89b78]">
                {index + 1}
              </Text>
              {/* red margin line */}
              <View className="ml-2 h-full w-px bg-[#d9a89b]/60" />

              {/* Item name — 3/4 of the writing area */}
              <TextInput
                value={row.name ?? ""}
                onChangeText={(text) => updateRow(row.id, "name", text)}
                placeholderTextColor="#b8a89a"
                style={{ flex: 3 }}
                className="h-full px-3 text-sm text-[#26303a]"
              />

              {/* divider between name and quantity */}
              <View className="h-full w-px bg-[#c9d9ea]/50" />

              {/* Quantity — 1/4 of the writing area */}
              <TextInput
                value={row.quantity ?? ""}
                onChangeText={(text) => updateRow(row.id, "quantity", text)}
                placeholderTextColor="#b8a89a"
                style={{ flex: 1 }}
                className="h-full px-3 text-sm text-center text-[#26303a]"
              />
            </View>
          ))}
        </View>
      </View>

      <View className="mx-3 gap-3">
        <Button
          label={
            filledRows.length
              ? `Send ${filledRows.length} item${filledRows.length > 1 ? "s" : ""} to shop`
              : "Send list to shop"
          }
          size="lg"
          loading={submitting}
          disabled={!filledRows.length}
          icon={
            !submitting && (
              <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
            )
          }
          onPress={() => void send()}
          className="shadow-lg"
          textClassName="font-bold tracking-wide"
        />
        <Text className="text-center text-xs font-medium text-muted-foreground">
          The shop will price your list and send it back
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
