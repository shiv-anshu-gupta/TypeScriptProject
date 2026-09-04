import { TextInput, View, Text } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useSendDraft } from "@/features/customer/draft-list/use-send-draft";
import { Button } from "@/components/ui/Button";
import { PhonePrompt } from "@/components/PhonePrompt";

// One numbered step in the "how this works" strip.
function Step({ n, label }: { n: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
        <Text className="text-[11px] font-bold text-primary-foreground">
          {n}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className="text-[11px] font-semibold text-foreground"
      >
        {label}
      </Text>
    </View>
  );
}

export function GroceryList() {
  const { t } = useTranslation();
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
      {/* Tells the customer, up front, what this blank paper is for. */}
      <View className="mx-3 gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <MaterialCommunityIcons
              name="notebook-edit-outline"
              size={22}
              color="#ffffff"
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {t("home.listTitle")}
            </Text>
            <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">
              {t("home.listSubtitle")}
            </Text>
          </View>
        </View>

        {/* Write → Send → Get the price */}
        <View className="flex-row items-center rounded-xl bg-secondary px-2 py-2.5">
          <Step n="1" label={t("home.step1")} />
          <Feather name="chevron-right" size={14} color="#ada291" />
          <Step n="2" label={t("home.step2")} />
          <Feather name="chevron-right" size={14} color="#ada291" />
          <Step n="3" label={t("home.step3")} />
        </View>
      </View>

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
              {t("home.item")}
            </Text>
            <View className="h-6 w-px bg-[#c9d9ea]/50" />
            <Text style={{ flex: 1 }} className="px-3 text-center text-xs font-bold uppercase tracking-widest text-[#3c5a64]">
              {t("home.qty")}
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
                // Only the first line shows an example, so the paper stays
                // clean but a first-time user knows what to write.
                placeholder={index === 0 ? t("home.itemExample") : ""}
                placeholderTextColor="#b8a89a"
                maxLength={60}
                style={{ flex: 3 }}
                className="h-full px-3 text-sm text-[#26303a]"
              />

              {/* divider between name and quantity */}
              <View className="h-full w-px bg-[#c9d9ea]/50" />

              {/* Quantity — 1/4 of the writing area */}
              <TextInput
                value={row.quantity ?? ""}
                onChangeText={(text) => updateRow(row.id, "quantity", text)}
                placeholder={index === 0 ? t("home.qtyExample") : ""}
                placeholderTextColor="#b8a89a"
                // A quantity is "2 kg" / "1 packet" — never 20 characters.
                maxLength={12}
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
              ? t("home.sendItems", { count: filledRows.length })
              : t("home.sendList")
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
          {t("home.priceNote")}
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
