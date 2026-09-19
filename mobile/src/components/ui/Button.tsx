/**
 * The app's one button: five variants, three sizes, a built-in busy state.
 *
 * @packageDocumentation
 */

import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  textClassName?: string;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary",
  outline: "border border-border bg-transparent",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  ghost: "bg-transparent",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-primary-foreground",
  outline: "text-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  ghost: "text-foreground",
};

const containerBySize: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-14 px-6",
};

/**
 * A tappable button with a label, an optional leading icon and a spinner while
 * the action it starts is still running.
 *
 * @remarks
 * `loading` also disables the button, so a caller does not have to set both to
 * stop a double tap. While loading the label and icon are replaced by a
 * spinner, not overlaid, so the button keeps its size but loses its text. The
 * spinner colour is chosen from the variant because `ActivityIndicator` takes a
 * colour value rather than a class.
 *
 * @param label - Already translated. This component does no `t()` lookup of its own.
 * @param icon - Drawn to the left of the label, and hidden while `loading`.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  className,
  textClassName,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center rounded-xl",
        containerBySize[size],
        containerByVariant[variant],
        isDisabled && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "destructive"
              ? "#fff"
              : "#1f2a2e"
          }
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={cn(
              "text-sm font-semibold",
              textByVariant[variant],
              textClassName,
            )}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
