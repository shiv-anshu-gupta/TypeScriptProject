import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db";
import { Category } from "../models/Category";
import { Product } from "../models/Product";

// Consolidate 45 fine-grained categories into 13 grocery-store categories.
// Every product under a source category is moved to its target, then the empty
// source category is deleted. Source names must match the DB exactly.
const GROUPS: { target: string; sources: string[] }[] = [
  {
    target: "आटा, चावल और दाल / Flour, Rice & Dal",
    sources: [
      "Aata",
      "मैदा / Maida",
      "सूजी / Semolina",
      "चावल / Rice",
      "पुलाव चावल / Pulao Rice",
      "दाले / Pulses",
      "साबूदाना / Sabudana",
      "पोहा / Poha",
      "Sevai",
      "किंकी / Kinki", // "Dawat Rice Rozana"
    ],
  },
  {
    target: "मसाले और नमक / Spices & Salt",
    sources: [
      "खड़े मसाले / Whole Spices",
      "पिसे मसाले / Ground Spices",
      "धनिया / Coriander",
      "हल्दी / Turmeric",
      "मिर्च / Chilli",
      "Salt",
    ],
  },
  {
    target: "तेल और घी / Oil & Ghee",
    sources: ["खाद्य तेल / Cooking Oil", "वनस्पति घी / Vanaspati Ghee", "घी / Ghee"],
  },
  {
    target: "चीनी और गुड़ / Sugar & Jaggery",
    sources: ["शक्कर / Sugar", "गुड़ / Jaggery"],
  },
  {
    target: "चाय और कॉफ़ी / Tea & Coffee",
    sources: ["चाय / Tea", "कॉफ़ी / Coffee"],
  },
  {
    target: "बिस्किट, नमकीन और चॉकलेट / Biscuits, Namkeen & Chocolate",
    sources: [
      "बिस्किट / Biscuits-Toast",
      "नमकीन / Namkeen",
      "स्नैक्स / Snacks",
      "चॉकलेट / Chocolates",
      "टॉफ़ी / Toffees",
    ],
  },
  {
    target: "मैगी और नूडल्स / Maggie & Noodles",
    sources: ["मैगी / Maggie", "नूडल्स / Noodles"],
  },
  {
    target: "मिठाई और पापड़ / Sweets & Papad",
    sources: ["मिठाई / Sweets", "पापड़ / Papad"],
  },
  {
    target: "सूखे मेवे / Dry Fruits",
    sources: ["सूखे मेवे / Dry Fruits"],
  },
  {
    target: "साबुन और सफ़ाई / Soap & Cleaning",
    sources: ["साबुन / Soap", "डिटर्जेंट पाउडर / Detergent Powder"],
  },
  {
    target: "पर्सनल केयर / Personal Care",
    sources: [
      "बालों का तेल / Hair Oil",
      "टूथब्रश / Toothbrush",
      "मंजन / Tooth Powder",
      "ब्यूटी प्रोडक्ट्स / Beauty Products",
      "परफ्यूम / Perfumes",
      "बालों की मेहंदी / Hair Mehndi",
      "हाथ की मेहंदी / Hand Mehndi",
      "Powder", // "WhiteTone Face Powder"
    ],
  },
  {
    target: "बेबी प्रोडक्ट्स / Baby Products",
    sources: ["Baby Products"],
  },
  {
    target: "पूजा सामग्री / Pooja Items",
    sources: ["पूजा सामग्री / Pooja Items"],
  },
];

async function run() {
  await connectDB();

  const productsBefore = await Product.countDocuments();
  let movedTotal = 0;
  let deletedTotal = 0;

  for (const group of GROUPS) {
    // Ensure the target category exists (reuse if a source already has that name).
    let target = await Category.findOne({ name: group.target });
    if (!target) {
      target = await Category.create({
        name: group.target,
        imageUrl: "",
        imagePublicId: "",
      });
      console.log(`+ created  ${group.target}`);
    }

    for (const sourceName of group.sources) {
      if (sourceName === group.target) continue; // target itself — keep as-is

      const src = await Category.findOne({ name: sourceName });
      if (!src) {
        console.log(`  ? source not found: ${sourceName}`);
        continue;
      }

      const res = await Product.updateMany(
        { category: src._id },
        { $set: { category: target._id } },
      );
      const moved = res.modifiedCount ?? 0;
      movedTotal += moved;

      await Category.deleteOne({ _id: src._id });
      deletedTotal++;

      console.log(
        `  ${String(moved).padStart(2)} product(s)  ${sourceName}  ->  ${group.target}`,
      );
    }
  }

  const productsAfter = await Product.countDocuments();
  const cats = await Category.find({}, "name").sort({ name: 1 }).lean();

  // Safety check: no product left pointing at a deleted category.
  const catIds = new Set(cats.map((c) => String(c._id)));
  const all = await Product.find({}, "category").lean();
  const orphans = all.filter((p) => !catIds.has(String(p.category))).length;

  console.log(`\nmoved ${movedTotal}, deleted ${deletedTotal} old categories`);
  console.log(
    `products: ${productsBefore} -> ${productsAfter}  (must be equal), orphans: ${orphans}`,
  );
  console.log(`\nfinal categories (${cats.length}):`);
  cats.forEach((c, i) => console.log(`${String(i + 1).padStart(2)}. ${c.name}`));

  await mongoose.disconnect();
  console.log("\ndone");
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
