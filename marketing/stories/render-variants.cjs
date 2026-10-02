// Renders variants.html — six takes on the same ad — to one PNG each.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const W = 1080, H = 1920;
const NAMES = ["A-dark", "B-diagonal", "C-paper", "D-price", "E-before-after", "F-shelf"];

(async () => {
  const outDir = path.join(__dirname, "out", "variants");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H * NAMES.length, deviceScaleFactor: 1 });
  await page.goto("file:///" + path.resolve(__dirname, "variants.html").split("\\").join("/"),
    { waitUntil: "networkidle0", timeout: 60000 });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const fams = await page.evaluate(() =>
    [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")))]);
  console.log("fonts:", fams.join(", ") || "NONE");
  if (!fams.includes("Baloo 2")) throw new Error("Baloo 2 did not load");

  for (const [i, name] of NAMES.entries()) {
    await page.screenshot({
      path: path.join(outDir, `${name}.png`),
      clip: { x: 0, y: i * H, width: W, height: H },
    });
    console.log("  " + name);
  }
  await browser.close();
  console.log(`\n${NAMES.length} variants in ${outDir}`);
})().catch((e) => { console.error(e); process.exit(1); });
