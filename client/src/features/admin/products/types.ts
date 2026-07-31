export type Category = {
  _id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

export type ProductCategory = {
  _id: string;
  name: string;
};

export type ProductStatus = "active" | "inactive";

export type ProductUnit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "dozen"
  | "pack";

export type Product = {
  _id: string;
  title: string;
  description: string;
  brand: string;
  category: ProductCategory;
  images: ProductImage[];
  unit?: ProductUnit;
  unitValue?: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryBody = {
  name: string;
};

export type UpdateCategoryBody = {
  name: string;
};

export type CreateProductBody = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: number;
  stock: number;
  status: ProductStatus;
};

export type UpdateProductBody = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: number;
  stock: number;
  status: ProductStatus;
  existingImages?: ProductImage[];
  coverImagePublicId?: string;
};

export type ProductFormState = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: string;
  stock: string;
  status: ProductStatus;
  existingImages: ProductImage[];
  newFiles: File[];
  coverImagePublicId: string;
};
