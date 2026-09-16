import { create } from "zustand";
import type { CustomerProductDetailsResponse, ProductSize } from "../types";
import { getCustomerProductDetails } from "../api";
import { getCoverImage } from "../product-list.shared";
import { toast } from "@/lib/toast";
import i18n from "@/lib/i18n";
import {
  addCustomerWishlist,
  removeCustomerWishlistItem,
} from "../../wishlist/api";
import { useCustomerWishlistStore } from "../../wishlist/store";

type CustomerProductDetailsStore = {
  loading: boolean;
  // Which product the data below belongs to. Product pages stack (tapping a
  // related product pushes another one), and they all read this single store,
  // so every screen checks that what's loaded is still its own product.
  productId: string;
  data: CustomerProductDetailsResponse | null;
  selectedImage: string;
  selectedColor: string;
  selectedSize: ProductSize | "";
  loadProduct: (productId: string) => Promise<void>;
  clear: () => void;
  setSelectedImage: (value: string) => void;
  setSelectedColor: (value: string) => void;
  setSelectedSize: (value: ProductSize | "") => void;
  toggleWishlist: (
    isLoaded: boolean,
    isBootstrapped: boolean,
    isSignedIn: boolean,
    isWishlistActive: boolean,
  ) => Promise<void>;
};

const defaultState = {
  loading: true,
  productId: "",
  data: null,
  selectedImage: "",
  selectedColor: "",
  selectedSize: "" as ProductSize | "",
};

export const useCustomerProductDetailsStore =
  create<CustomerProductDetailsStore>((set, get) => ({
    ...defaultState,
    loadProduct: async (productId) => {
      if (!productId) {
        set({ ...defaultState, loading: false });
        return;
      }

      set({
        loading: true,
        productId,
        data: null,
        selectedImage: "",
        selectedColor: "",
        selectedSize: "",
      });

      try {
        const response = await getCustomerProductDetails(productId);
        // Another product page took over while this was loading (or a slow
        // answer arrived after a newer one) - drop it.
        if (get().productId !== productId) return;
        const product = response?.product ?? null;

        set({
          loading: false,
          data: response ?? null,
          selectedImage: product ? getCoverImage(product) : "",
          selectedColor: product?.colors?.[0] || "",
          selectedSize: product?.sizes?.[0] || "",
        });
      } catch {
        if (get().productId !== productId) return;
        set({
          loading: false,
          productId,
          data: null,
          selectedImage: "",
          selectedColor: "",
          selectedSize: "",
        });
      }
    },

    clear: () => set(defaultState),
    setSelectedImage: (value) => set({ selectedImage: value }),
    setSelectedColor: (value) => set({ selectedColor: value }),
    setSelectedSize: (value) => set({ selectedSize: value }),
    toggleWishlist: async (
      isLoaded,
      isBootstrapped,
      isSignedIn,
      isWishlistActive,
    ) => {
      const product = get().data?.product ?? null;

      if (!product) return;

      if (!isLoaded || !isBootstrapped || !isSignedIn) {
        toast.error(i18n.t("product.signInToSave"));
        return;
      }

      try {
        if (isWishlistActive) {
          const response = await removeCustomerWishlistItem(product?._id);
          useCustomerWishlistStore.getState().setItems(response?.items ?? []);
          toast.success(i18n.t("product.removed"));
          return;
        }

        const response = await addCustomerWishlist({
          productId: product._id,
        });
        useCustomerWishlistStore.getState().setItems(response?.items ?? []);
        toast.success(i18n.t("product.saved"));
      } catch {
        toast.error(i18n.t("product.saveFailed"));
      }
    },
  }));
