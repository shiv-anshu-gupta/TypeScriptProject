import { useEffect, useRef } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useDraftListStore } from "@/features/customer/draft-list/store";

// Fixed geometry. The list sheet scrolls a focused line into view by its index,
// and fills its page with lines, so these are the single source for both the
// row styling and that maths - change a height here and it all stays correct.
export const ROW_HEIGHT = 44;
export const PAPER_HEADER_HEIGHT = 48;

type GroceryListEditorProps = {
  // Called with a line's index when either of its fields gains focus, so a
  // scrolling container can keep that line above the keyboard.
  onRowFocus?: (index: number) => void;
  // Put the cursor on the first empty line as soon as the editor appears, so
  // the keyboard is already up and the customer can just start writing.
  autoFocusOnOpen?: boolean;
  // Show only the written lines plus one blank line to continue on, instead of
  // every blank line - for a summary card rather than a full page.
  compact?: boolean;
};

// The handwritten-style paper the customer writes their list on. It is a view
// over the shared draft (the same one "Add to list" on products writes into).
//
// Built for typing a whole list without touching the screen: the keyboard's
// Next key goes item -> quantity -> next item, and a fresh line appears as the
// last one fills, so the list never runs out of lines. The paper is the root
// on purpose - the sheet's scroll-into-view maths assumes it starts at the top
// of the scroll content.
export function GroceryListEditor({
  onRowFocus,
  autoFocusOnOpen,
  compact,
}: GroceryListEditorProps) {
  const { t } = useTranslation();
  const rows = useDraftListStore((state) => state.rows);
  const updateRow = useDraftListStore((state) => state.updateRow);
  const removeRow = useDraftListStore((state) => state.removeRow);

  const nameRefs = useRef(new Map<number, TextInput | null>());
  const qtyRefs = useRef(new Map<number, TextInput | null>());

  // Handlers read the store directly rather than the render's `rows`: typing
  // on the last line appends a new one, so the list can change before a
  // keypress is handled.
  const focusName = (index: number) => {
    const row = useDraftListStore.getState().rows[index];
    if (!row) {
      Keyboard.dismiss(); // past the last line - nothing left to move to
      return;
    }
    nameRefs.current.get(row.id)?.focus();
  };

  // The first empty line - where the customer continues writing. The store
  // always keeps a blank line at the end, so there is always one.
  const focusFirstEmpty = () => {
    const list = useDraftListStore.getState().rows;
    const index = list.findIndex(
      (row) => !row.name.trim() && !row.quantity.trim(),
    );
    focusName(index === -1 ? list.length - 1 : index);
  };

  useEffect(() => {
    if (!autoFocusOnOpen) return;
    // Wait for the sheet's slide-in so the keyboard doesn't fight it.
    const timer = setTimeout(focusFirstEmpty, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocusOnOpen]);

  // Compact: every written line plus one blank line to continue on.
  const lastWritten = rows.reduce(
    (last, row, index) =>
      row.name.trim() || row.quantity.trim() ? index : last,
    -1,
  );
  const shownRows = compact ? rows.slice(0, lastWritten + 2) : rows;

  return (
    // Cream "paper" sheet with a soft shadow.
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
      {/* Header row */}
      <View
        style={{ height: PAPER_HEADER_HEIGHT }}
        className="flex-row items-center border-b-2 border-[#c9d9ea] bg-[#f5f0e8]"
      >
        <Text className="w-8 text-center text-xs font-bold tracking-wide text-[#8b7a5e]">
          #
        </Text>
        <View className="ml-2 h-6 w-px bg-[#d9a89b]" />
        <Text
          style={{ flex: 2.5 }}
          className="px-3 text-xs font-bold uppercase tracking-widest text-[#3c5a64]"
        >
          {t("home.item")}
        </Text>
        <View className="h-6 w-px bg-[#c9d9ea]/50" />
        <Text
          style={{ flex: 1.5 }}
          className="px-2 text-center text-xs font-bold uppercase tracking-widest text-[#3c5a64]"
        >
          {t("home.qty")}
        </Text>
        {/* keeps the columns aligned with the remove button below */}
        <View className="w-8" />
      </View>

      {shownRows.map((row, index) => {
        const filled = Boolean(row.name.trim() || row.quantity.trim());
        return (
          // Each line = a ruled row with a red left margin, like a rough copy.
          <View
            key={row.id}
            style={{ height: ROW_HEIGHT }}
            className={`flex-row items-center border-b border-[#c9d9ea] ${
              index % 2 === 0 ? "bg-white" : "bg-[#fdfbf7]"
            }`}
          >
            {/* The line number writes on that line too, so any tap on a line
                puts the cursor there. */}
            <Pressable
              onPress={() => nameRefs.current.get(row.id)?.focus()}
              className="h-full w-8 items-center justify-center"
            >
              <Text className="text-xs font-medium text-[#a89b78]">
                {index + 1}
              </Text>
            </Pressable>
            <View className="ml-2 h-full w-px bg-[#d9a89b]/60" />

            <TextInput
              ref={(input) => {
                nameRefs.current.set(row.id, input);
              }}
              value={row.name ?? ""}
              onChangeText={(text) => updateRow(row.id, "name", text)}
              onFocus={() => onRowFocus?.(index)}
              // Next -> this line's quantity, keeping the keyboard open.
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => qtyRefs.current.get(row.id)?.focus()}
              // Only the first line shows an example, so the paper stays
              // clean but a first-time user knows what to write.
              placeholder={index === 0 ? t("home.itemExample") : ""}
              placeholderTextColor="#b8a89a"
              maxLength={60}
              style={{ flex: 2.5 }}
              className="h-full px-3 text-sm text-[#26303a]"
            />

            <View className="h-full w-px bg-[#c9d9ea]/50" />

            <TextInput
              ref={(input) => {
                qtyRefs.current.set(row.id, input);
              }}
              value={row.quantity ?? ""}
              onChangeText={(text) => updateRow(row.id, "quantity", text)}
              onFocus={() => onRowFocus?.(index)}
              // Next -> the next line's item.
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => focusName(index + 1)}
              placeholder={index === 0 ? t("home.qtyExample") : ""}
              placeholderTextColor="#b8a89a"
              // A quantity is "2 kg" / "1 packet" — never 20 characters.
              maxLength={12}
              style={{ flex: 1.5 }}
              className="h-full px-2 text-center text-sm text-[#26303a]"
            />

            <View className="w-8 items-center">
              {filled ? (
                <Pressable
                  onPress={() => removeRow(row.id)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.removeItem")}
                >
                  <Feather name="x-circle" size={16} color="#c2ae98" />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
