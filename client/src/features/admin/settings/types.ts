// What a banner opens when a customer taps it in the app.
export type BannerLinkType = "none" | "writeList" | "shop" | "category" | "product";

export type AdminBanner = {
  _id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  link: { type: BannerLinkType; targetId?: string; targetName?: string };
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type AdminBannersResponse = {
  items: AdminBanner[];
  // How many live banners the app's Home carousel shows.
  limit: number;
};

export type UpdateBannerBody = Partial<{
  title: string;
  isActive: boolean;
  link: { type: BannerLinkType; targetId?: string };
  startsAt: string | null;
  endsAt: string | null;
}>;

// Where a banner stands right now, as the app sees it.
export type BannerStatus = "live" | "hidden" | "scheduled" | "ended" | "overLimit";
