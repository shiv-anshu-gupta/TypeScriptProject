import { create } from "zustand";
import type {
  AddCustomerCartItemBody,
  AppliedPromo,
  CheckoutAddressOption,
  CustomerCartItemIdentifier,
  CustomerCartResponse,
  GuestCartItem,
  SyncCustomerCartBody,
} from "./types";
import {
  addCustomerCartItem,
  applyCustomerPromo,
  decreaseCustomerCartItem,
  getCheckoutData,
  increaseCustomerCartItem,
  payWithPointsCheckout,
  removeCustomerCartItem,
  syncCustomerCart,
} from "./api";
import { toast } from "@/lib/toast";
import {
  clearGuestItems,
  readGuestItems,
  writeGuestItems,
} from "@/lib/guest-cart-storage";

type AddCartItemInput = AddCustomerCartItemBody & {
  title: string;
  brand: string;
  image: string;
};

type PointsArgs = {
  isSignedIn: boolean;
  onSuccess: () => void;
};

type CustomerCartAndCheckoutStore = {
  cart: CustomerCartResponse;
  isOpen: boolean;
  loading: boolean;
  addresses: CheckoutAddressOption[];
  selectedAddressId: string;
  promoInput: string;
  appliedPromo: AppliedPromo | null;
  points: number;
  promoLoading: boolean;
  checkoutLoading: boolean;
  pointsCheckoutLoading: boolean;
  setOpen: (value: boolean) => void;
  setCart: (cart: CustomerCartResponse) => void;
  setSelectedAddressId: (value: string) => void;
  loadCart: (isSignedIn: boolean) => Promise<void>;
  addItem: (item: AddCartItemInput, isSignedIn: boolean) => Promise<void>;
  increase: (
    item: CustomerCartItemIdentifier,
    isSignedIn: boolean,
  ) => Promise<void>;
  decrease: (
    item: CustomerCartItemIdentifier,
    isSignedIn: boolean,
  ) => Promise<void>;
  remove: (
    item: CustomerCartItemIdentifier,
    isSignedIn: boolean,
  ) => Promise<void>;
  setPromoInput: (value: string) => void;
  clearPromo: () => void;
  applyPromo: () => Promise<void>;
  startPointsCheckout: (args: PointsArgs) => Promise<void>;
  clear: () => void;
};

const emptyCart: CustomerCartResponse = {
  items: [],
  totalQuantity: 0,
};

const defaultUiState = {
  loading: false,
  addresses: [] as CheckoutAddressOption[],
  selectedAddressId: "",
  promoInput: "",
  appliedPromo: null as AppliedPromo | null,
  points: 0,
  promoLoading: false,
  checkoutLoading: false,
  pointsCheckoutLoading: false,
};

// ---- guest cart helpers (backed by AsyncStorage via guest-cart-storage) ----

function getGuestResponse(): CustomerCartResponse {
  const items = readGuestItems();

  return {
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function getGuestSyncPayload(): SyncCustomerCartBody {
  return {
    items: readGuestItems().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
    })),
  };
}

function isSameItem(
  item: CustomerCartItemIdentifier,
  target: CustomerCartItemIdentifier,
) {
  return (
    item.productId === target.productId &&
    (item.color || "") === (target.color || "") &&
    (item.size || "") === (target.size || "")
  );
}

function addGuestItem(item: Omit<GuestCartItem, "quantity">) {
  const items = readGuestItems();
  const index = items.findIndex((cartItem) => isSameItem(cartItem, item));

  if (index >= 0) {
    items[index] = {
      ...items[index],
      quantity: items[index].quantity + 1,
    };
  } else {
    items.push({
      ...item,
      quantity: 1,
    });
  }

  writeGuestItems([...items]);

  return getGuestResponse();
}

function increaseGuestItem(item: CustomerCartItemIdentifier) {
  const items = readGuestItems().map((cartItem) =>
    isSameItem(cartItem, item)
      ? { ...cartItem, quantity: cartItem.quantity + 1 }
      : cartItem,
  );

  writeGuestItems(items);

  return getGuestResponse();
}

function decreaseGuestItem(item: CustomerCartItemIdentifier) {
  const items = readGuestItems()
    .map((cartItem) =>
      isSameItem(cartItem, item)
        ? { ...cartItem, quantity: cartItem.quantity - 1 }
        : cartItem,
    )
    .filter((cartItem) => cartItem.quantity > 0);

  writeGuestItems(items);

  return getGuestResponse();
}

function removeGuestItem(item: CustomerCartItemIdentifier) {
  const items = readGuestItems().filter(
    (cartItem) => !isSameItem(cartItem, item),
  );

  writeGuestItems(items);
  return getGuestResponse();
}

export const useCustomerCartAndCheckoutStore =
  create<CustomerCartAndCheckoutStore>((set, get) => ({
    cart: emptyCart,
    isOpen: false,
    ...defaultUiState,
    setOpen: (value) => set({ isOpen: value }),
    setCart: (cart) => set({ cart }),
    setSelectedAddressId: (value) => set({ selectedAddressId: value }),
    loadCart: async (isSignedIn) => {
      try {
        set({ loading: true });
        if (isSignedIn) {
          const guestPayload = getGuestSyncPayload();

          if (guestPayload.items.length) {
            const syncedCart = await syncCustomerCart(guestPayload);

            clearGuestItems();
            set({ cart: syncedCart ?? emptyCart });
          }

          const response = await getCheckoutData();
          const cart = response?.cart ?? emptyCart;
          const addresses = response?.addresses?.items ?? [];
          const defaultAddress =
            addresses.find((item) => item.isDefault) || addresses[0] || null;

          set({
            loading: false,
            cart,
            addresses,
            selectedAddressId: defaultAddress?._id ?? "",
            points: response?.points ?? 0,
          });

          return;
        }

        set({
          loading: false,
          cart: getGuestResponse(),
          addresses: [],
          selectedAddressId: "",
          points: 0,
        });
      } catch {
        set({
          loading: false,
          cart: isSignedIn ? emptyCart : getGuestResponse(),
        });
      }
    },
    addItem: async (item, isSignedIn) => {
      try {
        if (isSignedIn) {
          const response = await addCustomerCartItem({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
          });

          set({ cart: response ?? emptyCart });
        } else {
          set({
            cart: addGuestItem({
              productId: item.productId,
              title: item.title,
              brand: item.brand,
              color: item.color,
              image: item.image,
              size: item.size,
            }),
          });
        }

        toast.success("Added to cart");
      } catch {
        toast.error("Failed to add in cart");
      }
    },
    increase: async (item, isSignedIn) => {
      try {
        const response = isSignedIn
          ? await increaseCustomerCartItem(item)
          : increaseGuestItem(item);

        set({ cart: response ?? emptyCart });
      } catch {
        toast.error("Failed to update cart");
      }
    },
    decrease: async (item, isSignedIn) => {
      try {
        const response = isSignedIn
          ? await decreaseCustomerCartItem(item)
          : decreaseGuestItem(item);

        set({ cart: response ?? emptyCart });
      } catch {
        toast.error("Failed to update cart");
      }
    },
    remove: async (item, isSignedIn) => {
      try {
        const response = isSignedIn
          ? await removeCustomerCartItem(item)
          : removeGuestItem(item);

        set({ cart: response ?? emptyCart });
        toast.success("Cart item removed");
      } catch {
        toast.error("Failed to remove from cart");
      }
    },
    setPromoInput: (value) => set({ promoInput: value }),
    clearPromo: () => set({ promoInput: "", appliedPromo: null }),
    applyPromo: async () => {
      const { promoInput } = get();

      // Cart has no prices in the quote-first flow — the order value is only
      // known once the shop prices the list, so promos validate server-side.
      const subtotal = 0;

      if (!promoInput.trim()) {
        set({ appliedPromo: null });
        return;
      }

      try {
        set({ promoLoading: true });
        const response = await applyCustomerPromo({
          code: promoInput.trim(),
          orderValue: subtotal,
        });

        if (!response?.code) {
          set({ appliedPromo: null, promoLoading: false });
          return;
        }

        set({
          appliedPromo: response,
          promoInput: response.code,
          promoLoading: false,
        });

        toast.success("Promo successfully applied");
      } catch {
        set({ appliedPromo: null, promoLoading: false });
        toast.error("Unable to apply promo");
      }
    },
    clear: () =>
      set({
        cart: emptyCart,
        isOpen: false,
        ...defaultUiState,
      }),

    startPointsCheckout: async ({ isSignedIn, onSuccess }) => {
      const { selectedAddressId, appliedPromo, points, cart } = get();

      if (!isSignedIn) {
        toast.error("Sign in to checkout");
        return;
      }

      if (!selectedAddressId) {
        toast.error("Add a default address from the profile section");
        return;
      }

      if (!cart.items.length) {
        toast.error("Your cart is empty");
        return;
      }

      // The order total isn't known until the shop prices the list, so the
      // points balance is validated server-side.
      try {
        set({ pointsCheckoutLoading: true });

        const response = await payWithPointsCheckout({
          addressId: selectedAddressId,
          promoCode: appliedPromo?.code || undefined,
        });

        if (!response._id) {
          throw new Error("Unable to place order");
        }

        set({
          cart: emptyCart,
          isOpen: false,
          ...defaultUiState,
          points: response.totalPoints ?? points,
        });

        toast.success("Order placed");
        onSuccess();
      } catch {
        set({ pointsCheckoutLoading: false });
        toast.error("Failed to place order with points");
      }
    },
  }));
