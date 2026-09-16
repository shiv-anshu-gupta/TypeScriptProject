import { useAuth } from "@clerk/clerk-expo";
import { useAuthStore } from "./store";
import { useEffect } from "react";
import { syncUser } from "./api";
import { setApiTokenGetter } from "@/lib/api";

export function useBootstrapAuth() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { setLoading, setUser, clearAuth, setError } = useAuthStore();

  useEffect(() => {
    setApiTokenGetter(async () => {
      const token = await getToken();
      return token ?? null;
    });
  }, [getToken]);

  useEffect(() => {
    async function run() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        clearAuth();
        return;
      }

      try {
        setLoading();

        // /auth/sync answers with the same user record /auth/me would, so
        // one round trip is enough on launch.
        const synced = await syncUser();

        setUser(synced?.user ?? null);
      } catch (error) {
        const errMessage =
          error instanceof Error ? error.message : "Failed to load user";
        setError(errMessage);
      }
    }

    void run();
  }, [isLoaded, isSignedIn, clearAuth, setError, setLoading, setUser]);
}
