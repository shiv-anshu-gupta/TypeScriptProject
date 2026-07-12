import * as SecureStore from "expo-secure-store";

// Clerk token cache backed by Expo SecureStore so the session persists
// securely across app restarts.
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
