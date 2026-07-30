import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db";
import { Category } from "../models/Category";

// Grocery categories in Hindi (Devanagari). English hint kept only as a comment
// for reference — the value written to the DB is the Hindi `name`.
const CATEGORY_NAMES: string[] = [
  "मैगी", // Maggie
  "शक्कर", // sakkar
  "धनिया", // dhania
  "हल्दी", // haldi
  "मिर्च", // mircha
  "साबूदाना", // sabudana
  "सूजी", // suji
  "मैदा", // maida
  "डिटर्जेंट पाउडर", // detergent powder
  "साबुन", // sabun
  "बालों का तेल", // hair oil
  "खड़े मसाले", // khade masale
  "बालों की मेहंदी", // balo ki mehndi
  "हाथ की मेहंदी", // hath ki mehndi
  "बिस्किट", // biscuits
  "नमकीन", // namkeen
  "किंकी", // kinki
  "पुलाव चावल", // pulao chawal
  "सूखे मेवे", // dry-fruits
  "परफ्यूम", // perfumes
  "ब्यूटी प्रोडक्ट्स", // beauty products
  "चाय", // chai
  "कॉफ़ी", // coffee
  "चॉकलेट", // chocolates
  "टॉफ़ी", // toffies
  "पापड़", // papad
  "खाद्य तेल", // cooking oils
  "वनस्पति घी", // vanaspati
  "घी", // ghee
  "मिठाई", // sweets
  "पिसे मसाले", // pise masale
  "स्नैक्स", // snacks
];

async function run() {
  await connectDB();

  // Existing names (trimmed) so we never create duplicates.
  const existing = new Set(
    (await Category.find({}, "name").lean()).map((c) =>
      String(c.name).trim(),
    ),
  );

  const toInsert = CATEGORY_NAMES.map((n) => n.trim()).filter(
    (n) => n && !existing.has(n),
  );

  const skipped = CATEGORY_NAMES.length - toInsert.length;

  if (toInsert.length) {
    await Category.insertMany(
      toInsert.map((name) => ({ name, imageUrl: "", imagePublicId: "" })),
    );
  }

  console.log(`Added ${toInsert.length} categor${toInsert.length === 1 ? "y" : "ies"}:`);
  toInsert.forEach((n) => console.log("  + " + n));
  console.log(`Skipped ${skipped} (already present).`);

  await mongoose.disconnect();
  console.log("done");
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
