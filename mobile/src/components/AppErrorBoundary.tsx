/**
 * The app-level error boundary: the last net under every screen.
 *
 * @remarks
 * Without this, one throw during render anywhere in the tree unmounts the
 * whole app — in release that is a white screen the customer can only
 * force-kill. The sheets already have their own guard (`SheetContentGuard`
 * in `ui/Sheet.tsx`); this is the same idea for everything else, mounted once
 * in `App.tsx`.
 *
 * Deliberately dependency-free: no i18n (the crash could be *in* i18n), no
 * NativeWind, no navigation — plain `StyleSheet` and hard-coded bilingual
 * copy, like the language picker, so either audience can read it.
 *
 * "Try again" clears the caught error and renders the children afresh. That
 * recovers from transient crashes (bad state that has since changed, a race
 * on startup). A crash that happens every render will simply land back here —
 * which is still strictly better than a dead app.
 *
 * @packageDocumentation
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { message: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { message: (error as Error)?.message || "Unknown error" };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // The one place a render crash is guaranteed to be recorded. In release
    // builds console.error still reaches logcat, so `adb logcat` (or a crash
    // reporter, when one is added) can see what actually broke.
    console.error("[app] a screen failed to render", error, info);
  }

  private retry = () => this.setState({ message: "" });

  render() {
    if (!this.state.message) return this.props.children;

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Kuch galat ho gaya</Text>
        <Text style={styles.subtitle}>Something went wrong</Text>
        <Text style={styles.body}>
          App ko dobara try karein · Please try again
        </Text>
        <Pressable
          onPress={this.retry}
          accessibilityRole="button"
          accessibilityLabel="Try again · Dobara try karein"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Try again · Dobara try karein</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
    backgroundColor: "#f6f4ef",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2a2e",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2a2e",
  },
  body: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 14,
    color: "#5b6b70",
  },
  button: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "#3c5a64",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
