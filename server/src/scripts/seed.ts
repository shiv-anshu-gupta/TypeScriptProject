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
// full tag combo -> first tag only -> generic "grocery".
function flickrCandidates(tags: string, w: number, h: number): string[] {
  const firstTag = tags.split(",")[0];
  return Array.from(
    new Set([
      `https://loremflickr.com/${w}/${h}/${tags}`,
      `https://loremflickr.com/${w}/${h}/${firstTag}`,
      `https://loremflickr.com/${w}/${h}/grocery`,
    ]),
  );
}

// Grocery-store images (loremflickr, keyword-based) — used only as the upload
// SOURCE; Cloudinary stores its own copy.
const bannerSources = [
  { tags: "grocery,store", w: 1200, h: 600 },
  { tags: "vegetables,market", w: 600, h: 600 },
  { tags: "supermarket,shelf", w: 600, h: 600 },
];

type ProductUnit = "kg" | "g" | "litre" | "ml" | "piece" | "dozen" | "pack";

type SeedProduct = {
  title: string;
  description: string;
  categoryName: string;
  brand: string;
  stock: number;
  unit: ProductUnit;
  imageTags: string[];
};

const categoryNames = [
  "Vegetables",
  "Fruits",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks",
];

const seedProducts: SeedProduct[] = [
  {
    title: "Fresh Tomatoes",
    description: "Ripe, juicy tomatoes — perfect for curries, salads and sauces.",
    categoryName: "Vegetables",
    brand: "Fresh Farm",
    stock: 80,
    unit: "kg",
    imageTags: ["tomato,vegetable"],
  },
  {
    title: "Potatoes",
    description: "Everyday farm potatoes, great for frying, boiling and roasting.",
    categoryName: "Vegetables",
    brand: "Fresh Farm",
    stock: 100,
    unit: "kg",
    imageTags: ["potato,vegetable"],
  },
  {
    title: "Bananas",
    description: "Sweet ripe bananas, sold by the dozen.",
    categoryName: "Fruits",
    brand: "Fresh Farm",
    stock: 60,
    unit: "dozen",
    imageTags: ["banana,fruit"],
  },
  {
    title: "Shimla Apples",
    description: "Crisp and juicy hill-grown apples.",
    categoryName: "Fruits",
    brand: "Himalaya Orchards",
    stock: 45,
    unit: "kg",
    imageTags: ["apple,fruit"],
  },
  {
    title: "Full Cream Milk",
    description: "Fresh full-cream dairy milk, 1 litre pack.",
    categoryName: "Dairy & Eggs",
    brand: "Amul",
    stock: 50,
    unit: "litre",
    imageTags: ["milk,bottle"],
  },
  {
    title: "Farm Eggs",
    description: "Farm-fresh eggs, sold by the dozen.",
    categoryName: "Dairy & Eggs",
    brand: "Happy Hen",
    stock: 40,
    unit: "dozen",
    imageTags: ["eggs"],
  },
  {
    title: "Whole Wheat Bread",
    description: "Soft whole-wheat sandwich loaf, freshly baked.",
    categoryName: "Bakery",
    brand: "Britannia",
    stock: 35,
    unit: "piece",
    imageTags: ["bread,bakery"],
  },
  {
    title: "Butter Croissants",
    description: "Flaky, buttery croissants — pack of 4.",
    categoryName: "Bakery",
    brand: "Baker's Corner",
    stock: 25,
    unit: "pack",
    imageTags: ["croissant,bakery"],
  },
  {
    title: "Orange Juice",
    description: "100% pressed orange juice, 1 litre.",
    categoryName: "Beverages",
    brand: "Tropicana",
    stock: 30,
    unit: "litre",
    imageTags: ["orange,juice"],
  },
  {
    title: "Green Tea",
    description: "Refreshing green tea bags, box of 25.",
    categoryName: "Beverages",
    brand: "Tetley",
    stock: 40,
    unit: "pack",
    imageTags: ["tea,drink"],
  },
  {
    title: "Classic Potato Chips",
    description: "Crunchy salted potato chips, family pack.",
    categoryName: "Snacks",
    brand: "Lay's",
    stock: 70,
    unit: "pack",
    imageTags: ["chips,snack"],
  },
  {
    title: "Salted Peanuts",
    description: "Roasted and salted peanuts, resealable pack.",
    categoryName: "Snacks",
    brand: "Nutty",
    stock: 55,
    unit: "pack",
    imageTags: ["peanuts,snack"],
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
      colors: [],
      sizes: [],
      unit: p.unit,
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
      minimumOrderValue: 200,
      startsAt: new Date(now - day),
      endsAt: new Date(now + 30 * day),
    },
    {
      code: "FRESH25",
      percentage: 25,
      count: 50,
      minimumOrderValue: 500,
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
