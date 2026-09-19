/**
 * The root of the app: the provider tree, the startup effects, and the two
 * screens that sit outside the navigator.
 *
 * @remarks
 * The order of the providers is load-bearing and two placements have bitten
 * before — the portal host sits inside the navigation container, and the
 * toaster sits outside the portal host. Both are explained where they are
 * written.
 *
 * @packageDocumentation
 */
import "./global.css";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalProvider } from "@gorhom/portal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";

import { env } from "@/lib/env";
import { tokenCache } from "@/lib/token-cache";
import { useBootstrapAuth } from "@/features/auth/useBootstrapAuth";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";
import { useCustomerAccountStore } from "@/features/customer/account/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { usePushNotifications } from "@/features/customer/push/use-push-notifications";
import { RootNavigator } from "@/navigation/RootNavigator";
import { Toaster } from "@/components/Toaster";
import { GroceryListSheet } from "@/components/GroceryListSheet";
import { QuantitySheetHost } from "@/components/QuantitySheet";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { StoreUpdatePrompt } from "@/components/StoreUpdatePrompt";
import { SplashScreen } from "@/screens/SplashScreen";
import { LanguagePicker } from "@/screens/LanguagePicker";
import i18n, { getStoredLanguage } from "@/lib/i18n";

/**
 * Runs the startup work and renders nothing.
 *
 * @remarks
 * A component rather than a hook in `App` so its state changes — Clerk
 * loading, a list arriving — re-render only this null node, and not the whole
 * provider tree with the navigator inside it.
 *
 * Four things happen here, and their gating differs. Auth and push are
 * wired by their own hooks. The draft list hydrates **unconditionally**,
 * because a list written before signing in is still the customer's list.
 * Everything else — lists, wishlist, profile — is loaded when Clerk says
 * somebody is signed in and **cleared** when it says nobody is, which is what
 * stops a shared phone leaking the previous customer's data.
 *
 * Nothing here blocks the first paint. The screens behind the splash are
 * already mounted and fetching while these run.
 */
function Bootstrap() {
  useBootstrapAuth();
  usePushNotifications();

  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  const clearLists = useCustomerGroceryListStore((state) => state.clear);
  const loadWishlist = useCustomerWishlistStore((state) => state.loadWishlist);
  const clearWishlist = useCustomerWishlistStore((state) => state.clear);
  const loadProfile = useCustomerAccountStore((state) => state.loadProfile);
  const clearProfile = useCustomerAccountStore((state) => state.clear);

  // Restore any half-written draft list from the last session.
  useEffect(() => {
    void useDraftListStore.getState().hydrate();
  }, []);

  // Keeps the "Lists" tab badge in sync with what the shop has sent back, the
  // wishlist loaded so the heart on every product card shows the right state
  // from the first screen, and the profile loaded so the Home avatar shows the
  // customer's saved name before they ever open Account.
  useEffect(() => {
    if (isSignedIn) {
      void loadLists();
      void loadWishlist();
      void loadProfile();
    } else {
      clearLists();
      clearWishlist();
      clearProfile();
    }
  }, [
    isSignedIn,
    loadLists,
    clearLists,
    loadWishlist,
    clearWishlist,
    loadProfile,
    clearProfile,
  ]);

  return null;
}

/**
 * Mounts the provider tree, and gates the first launch on a language.
 *
 * @remarks
 * Three things it owns that are easy to miss.
 *
 * **The language gate.** Nothing renders until the saved language has been
 * read back. With none stored, this is a first launch and the picker is shown
 * instead of the app — deliberately bilingual, so either audience can read
 * it.
 *
 * **The splash is a decoration.** Its progress counter is a timer, not real
 * loading: 4 % every 40 ms, then a 700 ms hold. The app underneath is mounted
 * from the start and the splash is drawn **over** it, so Clerk, the first
 * Home request and the customer's lists all load while the logo is still
 * showing — instead of starting only once it disappears. Changing the timings
 * changes how long the logo shows and nothing else.
 *
 * **Two screens are not in any navigator.** The splash and the language
 * picker are rendered here directly, which is why neither can navigate and
 * both take a callback instead.
 */
export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Language gate: apply the saved language, or show the picker on first launch.
  const [languageChecked, setLanguageChecked] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    void getStoredLanguage().then((lang) => {
      if (lang) void i18n.changeLanguage(lang);
      else setShowLanguagePicker(true);
      setLanguageChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!isSplashVisible) return;

    const interval = setInterval(() => {
      setLoadingProgress((current) => {
        const next = Math.min(current + 4, 100);

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsSplashVisible(false), 700);
        }

        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isSplashVisible]);

  if (!languageChecked) {
    return <SplashScreen progress={loadingProgress} />;
  }

  if (showLanguagePicker) {
    return <LanguagePicker onSelect={() => setShowLanguagePicker(false)} />;
  }

  // The app is mounted straight away and the splash is drawn ON TOP of it, so
  // Clerk, the first Home request and the customer's lists all load while the
  // logo is still showing - instead of starting only once it disappears.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={env.clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <SafeAreaProvider>
          <NavigationContainer>
            {/* Every sheet is drawn through this host, which is what lets one
                sheet open on top of another. It sits INSIDE the navigation
                container on purpose: a sheet's contents are ordinary screens'
                code - the list sheet's Send button navigates to the Lists tab -
                and outside this container that code has no navigation to use. */}
            <PortalProvider>
              <Bootstrap />
              <RootNavigator />
              {/* Slides up over everything when the centre tab button is tapped */}
              <GroceryListSheet />
              {/* One quantity picker for every product card in the app */}
              <QuantitySheetHost />
              <UpdatePrompt />
              {/* Play Store (native release) update prompt — on top of the OTA one */}
              <StoreUpdatePrompt />
              <StatusBar style="dark" />
            </PortalProvider>
          </NavigationContainer>
          {/* Above the sheets, not inside them: a sheet is drawn over the
              whole app, and a message the customer must read ("8 items added
              - please check them") is worth nothing behind it. */}
          <Toaster />
        </SafeAreaProvider>
      </ClerkProvider>
      {isSplashVisible ? (
        <View style={StyleSheet.absoluteFill}>
          <SplashScreen progress={loadingProgress} />
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}
