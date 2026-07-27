import { create } from "zustand";
import type { CustomerProductDetailsResponse, ProductSize } from "../types";
import { getCustomerProductDetails } from "../api";
import { getCoverImage } from "../product-list.shared";
import { toast } from "@/lib/toast";
import {
  addCustomerWishlist,
  removeCustomerWishlistItem,
} from "../../wishlist/api";
import { useCustomerWishlistStore } from "../../wishlist/store";

type CustomerProductDetailsStore = {
  loading: boolean;
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
        set({
          loading: false,
          data: null,
          selectedImage: "",
          selectedColor: "",
          selectedSize: "",
        });
      }

      set({
        loading: true,
        data: null,
        selectedImage: "",
        selectedColor: "",
        selectedSize: "",
      });

      try {
        const response = await getCustomerProductDetails(productId);
        const product = response?.product ?? null;

        set({
          loading: false,
          data: response ?? null,
          selectedImage: product ? getCoverImage(product) : "",
          selectedColor: product?.colors?.[0] || "",
          selectedSize: product?.sizes?.[0] || "",
        });
      } catch {
        set({
          loading: false,
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
        toast.error("Sign in to save");
        return;
      }

      try {
        if (isWishlistActive) {
          const response = await removeCustomerWishlistItem(product?._id);
          useCustomerWishlistStore.getState().setItems(response?.items ?? []);
          toast.success("Removed");
          return;
        }

        const response = await addCustomerWishlist({
          productId: product._id,
        });
        useCustomerWishlistStore.getState().setItems(response?.items ?? []);
        toast.success("Saved");
      } catch {
        toast.error("Failed to toggle wishlist items");
      }
    },
  }));
