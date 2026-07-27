import "./global.css";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";

import { env } from "@/lib/env";
import { tokenCache } from "@/lib/token-cache";
import { useBootstrapAuth } from "@/features/auth/useBootstrapAuth";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { usePushNotifications } from "@/features/customer/push/use-push-notifications";
import { RootNavigator } from "@/navigation/RootNavigator";
import { Toaster } from "@/components/Toaster";

function Bootstrap() {
  useBootstrapAuth();
  usePushNotifications();

  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  const clearLists = useCustomerGroceryListStore((state) => state.clear);

  // Restore any half-written draft list from the last session.
  useEffect(() => {
    void useDraftListStore.getState().hydrate();
  }, []);

  // Keeps the "Lists" tab badge in sync with what the shop has sent back.
  useEffect(() => {
    if (isSignedIn) {
      void loadLists();
    } else {
      clearLists();
    }
  }, [isSignedIn, loadLists, clearLists]);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={env.clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <SafeAreaProvider>
          <NavigationContainer>
            <Bootstrap />
            <RootNavigator />
            <Toaster />
            <StatusBar style="dark" />
          </NavigationContainer>
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
