/**
 * The app's transient messages: a tiny store the `Toaster` renders, plus a
 * `toast` object callable from anywhere.
 *
 * @packageDocumentation
 */

import { create } from "zustand";

/**
 * Which of the three pill styles a message is drawn in.
 *
 * @remarks
 * Purely cosmetic: all three behave the same and dismiss on the same timer.
 */
export type ToastVariant = "success" | "error" | "info";

/**
 * One message currently on screen.
 *
 * @remarks
 * `id` comes from a module counter, not from the message, so the same text
 * shown twice is two entries and each dismisses on its own timer.
 */
export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastStore = {
  toasts: ToastItem[];
  push: (message: string, variant: ToastVariant) => void;
  dismiss: (id: number) => void;
};

let counter = 0;

/**
 * Holds the messages currently on screen.
 *
 * @remarks
 * Written only by the {@link toast} helpers and by the `Toaster`, which calls
 * `dismiss` when a pill is swiped away. Nothing is persisted; a restart
 * starts with no messages, which is correct — a message is about something
 * that just happened.
 *
 * `push` schedules its own removal 2500 ms later, so a caller never has to
 * dismiss. The timer is not cancelled by an early `dismiss`; it simply finds
 * nothing to remove.
 *
 * Read by exactly one component. The `Toaster` is mounted outside the portal
 * host, above every sheet, so a message the customer must read is never drawn
 * behind one.
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant) => {
    counter += 1;
    const id = counter;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Shows a message from anywhere, React or not.
 *
 * @remarks
 * Drop-in replacement for sonner's `toast` API used across the ported stores.
 *
 * It reaches the store through `getState()`, so stores, api callers and
 * plain functions can all use it without a hook. The message is shown
 * verbatim — callers translate first, usually through the default `i18n.t`
 * import rather than `useTranslation`.
 *
 * @example
 * ```ts
 * toast.success(i18n.t("lists.sentToShop"));
 * ```
 */
export const toast = {
  success: (message: string) =>
    useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
  info: (message: string) => useToastStore.getState().push(message, "info"),
};
