// What a banner opens when tapped - chosen in the admin panel.
export type BannerLink =
  | { type: "none" | "writeList" | "shop" }
  | { type: "category" | "product"; targetId: string };

export type CustomerHomeBanner = {
  _id: string;
  imageUrl: string;
  // Admin's name for the banner; read aloud by screen readers.
  title?: string;
  // Missing from servers older than banner links - treated as "none".
  link?: BannerLink;
  createdAt: string;
};

export type CustomerHomeCategory = {
  _id: string;
  name: string;
  imageUrl?: string;
};

export type CustomerHomeProduct = {
  _id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
  unitValue?: number;
  createdAt: string;
};

export type CustomerHomeCoupon = {
  _id: string;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  endsAt: string;
};

export type CustomerHomeResponse = {
  banners: CustomerHomeBanner[];
  categories: CustomerHomeCategory[];
  recentProducts: CustomerHomeProduct[];
  coupons: CustomerHomeCoupon[];
};
