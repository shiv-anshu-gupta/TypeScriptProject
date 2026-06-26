import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "../db";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { Banner } from "../models/Banner";
import { Product } from "../models/Product";
import { Promo } from "../models/Promo";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary fetches the remote URL server-side and stores its own copy,
// returning a real secure_url + public_id (exactly how the app stores images).
async function uploadFromUrl(
  url: string,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const res = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: "image",
  });
  return { url: res.secure_url, publicId: res.public_id };
}

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// loremflickr can return transient 500s or have no match for a tag combo.
// Try each candidate URL with retries before giving up.
async function uploadWithFallback(
  candidateUrls: string[],
  folder: string,
): Promise<{ url: string; publicId: string }> {
  let lastErr: unknown;
  for (const candidate of candidateUrls) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await uploadFromUrl(candidate, folder);
      } catch (err) {
        lastErr = err;
        await wait(800);
      }
    }
  }
  throw lastErr;
}

// Build resilient candidate list from comma-separated loremflickr tags:
// full tag combo -> first tag only -> generic "clothing".
function flickrCandidates(tags: string, w: number, h: number): string[] {
  const firstTag = tags.split(",")[0];
  return Array.from(
    new Set([
      `https://loremflickr.com/${w}/${h}/${tags}`,
      `https://loremflickr.com/${w}/${h}/${firstTag}`,
      `https://loremflickr.com/${w}/${h}/clothing`,
    ]),
  );
}

// Clothing/fashion-store images (loremflickr, keyword-based) — used only as
// the upload SOURCE; Cloudinary stores its own copy.
const bannerSources = [
  { tags: "fashion,clothing,store", w: 1200, h: 600 },
  { tags: "clothing,boutique", w: 600, h: 600 },
  { tags: "apparel,fashion", w: 600, h: 600 },
];

type SeedProduct = {
  title: string;
  description: string;
  categoryName: string;
  brand: string;
  stock: number;
  colors: string[];
  sizes: ("S" | "M" | "L" | "XL")[];
  price: number;
  salePercentage: number;
  imageTags: string[];
};

const categoryNames = ["Shirts", "Pants", "Shoes", "Accessories"];

const seedProducts: SeedProduct[] = [
  {
    title: "Classic Oxford Shirt",
    description:
      "A timeless button-down crafted from breathable cotton. Perfect for work or weekend wear.",
    categoryName: "Shirts",
    brand: "Northfield",
    stock: 40,
    colors: ["#ffffff", "#1e3a8a", "#111827"],
    sizes: ["S", "M", "L", "XL"],
    price: 2499,
    salePercentage: 15,
    imageTags: ["oxford,shirt", "mens,dress,shirt"],
  },
  {
    title: "Linen Casual Shirt",
    description:
      "Lightweight linen shirt with a relaxed fit, ideal for warm days and easy styling.",
    categoryName: "Shirts",
    brand: "Coastline",
    stock: 25,
    colors: ["#f5f5dc", "#bae6fd"],
    sizes: ["M", "L", "XL"],
    price: 2899,
    salePercentage: 0,
    imageTags: ["linen,shirt", "casual,mens,shirt"],
  },
  {
    title: "Slim Fit Chinos",
    description:
      "Versatile stretch chinos with a tailored slim fit and all-day comfort.",
    categoryName: "Pants",
    brand: "Northfield",
    stock: 35,
    colors: ["#78716c", "#1f2937", "#0f766e"],
    sizes: ["S", "M", "L", "XL"],
    price: 3199,
    salePercentage: 20,
    imageTags: ["chinos,trousers", "mens,pants"],
  },
  {
    title: "Tapered Denim Jeans",
    description:
      "Mid-wash tapered jeans made with durable denim and a hint of stretch.",
    categoryName: "Pants",
    brand: "Ironside",
    stock: 50,
    colors: ["#1e3a8a", "#111827"],
    sizes: ["S", "M", "L", "XL"],
    price: 3799,
    salePercentage: 10,
    imageTags: ["denim,jeans", "blue,jeans"],
  },
  {
    title: "Everyday Running Sneakers",
    description:
      "Cushioned, breathable sneakers built for daily runs and long walks alike.",
    categoryName: "Shoes",
    brand: "Stride",
    stock: 30,
    colors: ["#111827", "#dc2626", "#ffffff"],
    sizes: ["M", "L", "XL"],
    price: 4599,
    salePercentage: 25,
    imageTags: ["sneakers,shoes", "running,shoes"],
  },
  {
    title: "Leather Derby Shoes",
    description:
      "Hand-finished leather derby shoes with a classic silhouette for formal occasions.",
    categoryName: "Shoes",
    brand: "Marlow",
    stock: 18,
    colors: ["#451a03", "#111827"],
    sizes: ["M", "L", "XL"],
    price: 5999,
    salePercentage: 0,
    imageTags: ["leather,shoes", "formal,shoes"],
  },
  {
    title: "Minimalist Leather Belt",
    description:
      "A premium full-grain leather belt with a brushed metal buckle.",
    categoryName: "Accessories",
    brand: "Marlow",
    stock: 60,
    colors: ["#451a03", "#111827"],
    sizes: ["S", "M", "L"],
    price: 1499,
    salePercentage: 5,
    imageTags: ["leather,belt", "belt,accessory"],
  },
  {
    title: "Canvas Weekender Bag",
    description:
      "Spacious water-resistant canvas duffel with leather trims for short getaways.",
    categoryName: "Accessories",
    brand: "Coastline",
    stock: 22,
    colors: ["#78716c", "#1f2937"],
    sizes: ["L", "XL"],
    price: 3499,
    salePercentage: 30,
    imageTags: ["canvas,bag", "duffel,bag"],
  },
];

const SEED_CLERK_ID = "seed-admin-user";
const CLOUD_FOLDER = "ecommerce-monster-video/seed";

async function run() {
  await connectDB();
  console.log("Seeding...");

  // 1. Demo admin user (owner of banners/products via createdBy)
  let adminUser = await User.findOne({ clerkUserId: SEED_CLERK_ID });
  if (!adminUser) {
    adminUser = await User.create({
      clerkUserId: SEED_CLERK_ID,
      name: "Demo Admin",
      email: "demo-admin@example.com",
      role: "admin",
      points: 0,
    });
    console.log("Created demo admin user");
  } else {
    console.log("Reusing existing demo admin user");
  }

  // 2. Wipe demo collections (leaves Cart/Order/Wishlist & real users untouched)
  await Promise.all([
    Banner.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Promo.deleteMany({}),
  ]);
  console.log("Cleared Banners, Categories, Products, Promos");

  // 3. Categories
  const categories = await Category.insertMany(
    categoryNames.map((name) => ({ name })),
  );
  const categoryByName = new Map(
    categories.map((c: any) => [c.name as string, c._id]),
  );
  console.log(`Inserted ${categories.length} categories`);

  // 4. Banners (upload to Cloudinary)
  console.log("Uploading banner images to Cloudinary...");
  const bannerDocs = [];
  for (const b of bannerSources) {
    const img = await uploadWithFallback(
      flickrCandidates(b.tags, b.w, b.h),
      `${CLOUD_FOLDER}/banners`,
    );
    bannerDocs.push({
      imageUrl: img.url,
      imagePublicId: img.publicId,
      createdBy: adminUser._id,
    });
  }
  await Banner.insertMany(bannerDocs);
  console.log(`Inserted ${bannerDocs.length} banners`);

  // 5. Products (upload each image to Cloudinary)
  console.log("Uploading product images to Cloudinary...");
  const productDocs = [];
  for (const p of seedProducts) {
    const images = [];
    for (let i = 0; i < p.imageTags.length; i++) {
      const tags = p.imageTags[i];
      const img = await uploadWithFallback(
        flickrCandidates(tags, 800, 1000),
        `${CLOUD_FOLDER}/products`,
      );
      images.push({
        url: img.url,
        publicId: img.publicId,
        isCover: i === 0,
      });
    }
    productDocs.push({
      title: p.title,
      description: p.description,
      category: categoryByName.get(p.categoryName),
      brand: p.brand,
      stock: p.stock,
      images,
      colors: p.colors,
      sizes: p.sizes,
      price: p.price,
      salePercentage: p.salePercentage,
      status: "active",
      createdBy: adminUser._id,
    });
    console.log(`  Prepared "${p.title}"`);
  }
  await Product.insertMany(productDocs);
  console.log(`Inserted ${productDocs.length} products`);

  // 6. Promos (active window so they appear on Home)
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await Promo.insertMany([
    {
      code: "WELCOME10",
      percentage: 10,
      count: 100,
      minimumOrderValue: 1000,
      startsAt: new Date(now - day),
      endsAt: new Date(now + 30 * day),
    },
    {
      code: "BIGSALE25",
      percentage: 25,
      count: 50,
      minimumOrderValue: 3000,
      startsAt: new Date(now - day),
      endsAt: new Date(now + 14 * day),
    },
  ]);
  console.log("Inserted 2 promos");

  console.log("\n✅ Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
