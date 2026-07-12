import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GuestCartItem } from "@/features/customer/cart-and-checkout/types";

// React Native has no synchronous localStorage. The cart store's guest-cart
// helpers are synchronous, so we keep an in-memory array as the source of
// truth, hydrate it once from AsyncStorage at app start, and mirror every
// write back to AsyncStorage (fire-and-forget) for persistence across reloads.

const GUEST_CART_KEY = "guest_cart_items";

let guestItems: GuestCartItem[] = [];
let hydrated = false;

export async function hydrateGuestCart(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    guestItems = Array.isArray(parsed)
      ? parsed.filter(
          (item) => item?.productId && Number(item?.quantity) > 0,
        )
      : [];
  } catch {
    guestItems = [];
  }
  hydrated = true;
}

export function readGuestItems(): GuestCartItem[] {
  return guestItems;
}

export function writeGuestItems(items: GuestCartItem[]): void {
  guestItems = items;
  void AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items)).catch(
    () => {},
  );
}

export function clearGuestItems(): void {
  guestItems = [];
  void AsyncStorage.removeItem(GUEST_CART_KEY).catch(() => {});
}
