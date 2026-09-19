/**
 * The bordered panel every grouped block of content sits in.
 *
 * @packageDocumentation
 */

import { View } from "react-native";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A rounded, bordered surface that groups related content — an order, a
 * settings block, a product tile.
 *
 * @remarks
 * `overflow-hidden` is part of the contract: a child image may run to the edge
 * and still be clipped to the rounded corner. It adds no padding, so the
 * caller decides the inner spacing.
 */
export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      {children}
    </View>
  );
}
