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
          color={variant === "primary" || variant === "destructive" ? "#fff" : "#1d2a2f"}
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
