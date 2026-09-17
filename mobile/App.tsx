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
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { StoreUpdatePrompt } from "@/components/StoreUpdatePrompt";
import { SplashScreen } from "@/screens/SplashScreen";
import { LanguagePicker } from "@/screens/LanguagePicker";
import i18n, { getStoredLanguage } from "@/lib/i18n";

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
          {/* Every sheet in the app is drawn through this host, which is what
              lets one sheet open on top of another. */}
          <PortalProvider>
            <NavigationContainer>
              <Bootstrap />
              <RootNavigator />
              {/* Slides up over everything when the centre tab button is tapped */}
              <GroceryListSheet />
              <UpdatePrompt />
              {/* Play Store (native release) update prompt — on top of the OTA one */}
              <StoreUpdatePrompt />
              <StatusBar style="dark" />
            </NavigationContainer>
          </PortalProvider>
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
