/**
 * A handle on the navigator for code that runs outside any screen.
 *
 * @remarks
 * A notification tap arrives in a listener, not in a screen, so it has no
 * `useNavigation()` to call. This ref is handed to the `NavigationContainer`
 * in `App.tsx`, and anything outside React can navigate through it.
 *
 * The container is not ready on a cold start: the tap that launched the app
 * is read before the navigator has mounted. {@link runWhenNavigationReady}
 * therefore keeps the latest request and {@link flushPendingNavigation} —
 * called from the container's `onReady` — runs it once the navigator exists.
 *
 * @packageDocumentation
 */

import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

/** The app's one navigation container, usable from outside screens. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Only the latest request is kept: two taps before the navigator is ready
// should land on the second one, not replay both.
let pending: (() => void) | null = null;

/**
 * Runs `action` now if the navigator is ready, otherwise as soon as it is.
 *
 * @param action - Navigation to perform; it may assume `navigationRef` is ready.
 */
export function runWhenNavigationReady(action: () => void): void {
  if (navigationRef.isReady()) {
    action();
  } else {
    pending = action;
  }
}

/**
 * Runs the navigation queued while the navigator was not ready, if any.
 * Pass it to the `NavigationContainer`'s `onReady`.
 */
export function flushPendingNavigation(): void {
  if (!pending || !navigationRef.isReady()) return;
  const action = pending;
  pending = null;
  action();
}
