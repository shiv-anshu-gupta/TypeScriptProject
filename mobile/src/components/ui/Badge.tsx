/**
 * The small rounded label used for stock, status and category chips.
 *
 * @packageDocumentation
 */

import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  textClassName?: string;
};

/**
 * A pill-shaped label that sits beside content it describes, such as "In stock"
 * on a product or a status word on an order card.
 *
 * @remarks
 * A presentation-only primitive: no state, no press handling. It is
 * `self-start`, so it shrinks to its text rather than filling the row. The two
 * class props exist because the caller styles the pill and its text separately
 * — `className` lands on the outer view, `textClassName` on the text inside it.
 *
 * @param children - Rendered inside a `Text`, so pass a string or number, not a view.
 */
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
