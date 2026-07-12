import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  textClassName?: string;
};

export function Badge({ children, className, textClassName }: BadgeProps) {
  return (
    <View
      className={cn(
        "self-start rounded-full border border-border bg-secondary px-2.5 py-1",
        className,
      )}
    >
      <Text
        className={cn(
          "text-xs font-medium text-secondary-foreground",
          textClassName,
        )}
      >
        {children}
      </Text>
    </View>
  );
}
