/**
 * A head start for the in-app browser the OAuth login opens.
 *
 * @packageDocumentation
 */

import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";

/**
 * Warming up the browser on Android makes the OAuth sheet open noticeably
 * faster; it's a no-op on iOS. Recommended by Clerk's Expo OAuth guide.
 *
 * @remarks
 * Call it from the screen that holds the Google button, not from the app
 * root: the warm-up is released on unmount, so holding a browser process open
 * for the whole session buys nothing.
 *
 * Purely an optimisation. If it fails the login still works, just more
 * slowly, which is why neither call is awaited or caught.
 */
export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}
