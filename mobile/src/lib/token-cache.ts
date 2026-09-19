/**
 * Where Clerk keeps its session token on this device.
 *
 * @packageDocumentation
 */

import * as SecureStore from "expo-secure-store";

/**
 * Clerk token cache backed by Expo SecureStore so the session persists
 * securely across app restarts.
 *
 * @remarks
 * Passed to `ClerkProvider` at the root of the tree and used by nothing else.
 *
 * Both accessors swallow their errors on purpose. SecureStore can fail on a
 * device with no screen lock or a damaged keystore, and a customer who cannot
 * cache a token should still be able to sign in for this session — so a read
 * failure reads as "no cached session" and a write failure is ignored. The
 * cost is that such a device signs in again after every restart.
 */
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore write failures
    }
  },
};
