import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db";
import { Category } from "../models/Category";

// Hindi (exactly as stored) -> English. The final category name becomes
// "<Hindi> / <English>" so both Hindi- and English-speaking users can search.
const HINDI_TO_ENGLISH: Record<string, string> = {
  किंकी: "Kinki",
  कॉफ़ी: "Coffee",
  "खड़े मसाले": "Whole Spices",
  "खाद्य तेल": "Cooking Oil",
  गुड़: "Jaggery",
  घी: "Ghee",
  चाय: "Tea",
  चावल: "Rice",
  चॉकलेट: "Chocolates",
  टूथब्रश: "Toothbrush",
  टॉफ़ी: "Toffees",
  "डिटर्जेंट पाउडर": "Detergent Powder",
  दाले: "Pulses",
  धनिया: "Coriander",
  नमकीन: "Namkeen",
  नूडल्स: "Noodles",
  परफ्यूम: "Perfumes",
  पापड़: "Papad",
  "पिसे मसाले": "Ground Spices",
  "पुलाव चावल": "Pulao Rice",
  "पूजा सामग्री": "Pooja Items",
  "बालों का तेल": "Hair Oil",
  "बालों की मेहंदी": "Hair Mehndi",
  बिस्किट: "Biscuits",
  "ब्यूटी प्रोडक्ट्स": "Beauty Products",
  मंजन: "Tooth Powder",
  मिठाई: "Sweets",
  मिर्च: "Chilli",
  मैगी: "Maggie",
  मैदा: "Maida",
  "वनस्पति घी": "Vanaspati Ghee",
  शक्कर: "Sugar",
  साबुन: "Soap",
  साबूदाना: "Sabudana",
  "सूखे मेवे": "Dry Fruits",
  सूजी: "Semolina",
  स्नैक्स: "Snacks",
  हल्दी: "Turmeric",
  "हाथ की मेहंदी": "Hand Mehndi",
  पोहा: "Poha",
};

function bilingual(hindi: string, english: string) {
  return `${hindi} / ${english}`;
}

async function run() {
  await connectDB();

  const cats = await Category.find({}).sort({ name: 1 });

  let updated = 0;
  let already = 0;
  const unknown: string[] = [];

  for (const cat of cats) {
    const current = String(cat.name).trim();

    // Already in "Hindi / English" form? leave it.
    if (current.includes("/")) {
      already++;
      continue;
    }

    const english = HINDI_TO_ENGLISH[current];
    if (!english) {
      unknown.push(current);
      continue;
    }

    cat.name = bilingual(current, english);
    await cat.save();
    updated++;
    console.log(`  ✓ ${current}  ->  ${cat.name}`);
  }

  // Make sure Poha exists (as "पोहा / Poha"), add if missing.
  const pohaName = bilingual("पोहा", "Poha");
  const pohaExists = await Category.findOne({
    name: { $in: ["पोहा", pohaName] },
  });
  if (!pohaExists) {
    await Category.create({ name: pohaName, imageUrl: "", imagePublicId: "" });
    console.log(`  + added ${pohaName}`);
  } else if (pohaExists.name.trim() !== pohaName) {
    pohaExists.name = pohaName;
    await pohaExists.save();
    console.log(`  ✓ ${pohaExists.name}`);
  }

  console.log(
    `\nUpdated ${updated}, already bilingual ${already}, unknown ${unknown.length}`,
  );
  if (unknown.length) {
    console.log("UNKNOWN (left unchanged — no English mapping):");
    unknown.forEach((u) => console.log("  ? " + u));
  }

  await mongoose.disconnect();
  console.log("done");
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
