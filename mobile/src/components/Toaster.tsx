import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useToastStore, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

const iconByVariant: Record<ToastVariant, keyof typeof Feather.glyphMap> = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
};

const colorByVariant: Record<ToastVariant, string> = {
  success: "#4f7a4d",
  error: "#c0492f",
  info: "#2563eb",
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  return (
    <View
      pointerEvents="none"
      style={{ top: insets.top + 8 }}
      className="absolute left-0 right-0 z-50 items-center gap-2 px-4"
    >
      {toasts.map((item) => (
        <View
          key={item.id}
          className={cn(
            "w-full max-w-md flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg",
          )}
        >
          <Feather
            name={iconByVariant[item.variant]}
            size={18}
            color={colorByVariant[item.variant]}
          />
          <Text className="flex-1 text-sm font-medium text-foreground">
            {item.message}
          </Text>
        </View>
      ))}
    </View>
  );
}
