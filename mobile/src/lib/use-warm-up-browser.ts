import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";

// Warming up the browser on Android makes the OAuth sheet open noticeably
// faster; it's a no-op on iOS. Recommended by Clerk's Expo OAuth guide.
export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}
