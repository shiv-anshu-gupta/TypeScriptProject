// Renders the two launch posts: today's teaser and tomorrow's reveal.
// Square for WhatsApp status and feed; a 9:16 crop of each for stories.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const QRCode = require("qrcode");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.skirana.app";
const S = 1080;
const POSTS = [
  { name: "1-teaser", about: "today - says something is coming, not what" },
  { name: "2-live", about: "tomorrow - the answer, with the QR" },
];

(async () => {
  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });

  const svg = await QRCode.toString(PLAY_URL, {
    type: "svg", errorCorrectionLevel: "H", margin: 0,
    color: { dark: "#1f2a2e", light: "#ffffff" },
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: S, height: S * POSTS.length, deviceScaleFactor: 1 });
  await page.goto("file:///" + path.resolve(__dirname, "launch.html").split("\\").join("/"),
    { waitUntil: "networkidle0", timeout: 60000 });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const fams = await page.evaluate(() => [...new Set([...document.fonts]
    .filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")))]);
  console.log("fonts:", fams.join(", ") || "NONE");
  if (!fams.includes("Baloo 2")) throw new Error("Baloo 2 did not load");

  // The page fetches the QR, which Chrome blocks on file:// - put it in.
  await page.evaluate((markup) => {
    document.getElementById("qr").innerHTML = markup;
  }, svg);
  const qrOk = await page.evaluate(() => !!document.querySelector("#qr svg"));
  if (!qrOk) throw new Error("the QR did not render - the live post would be useless");

  for (const [i, post] of POSTS.entries()) {
    const top = i * S;
    await page.screenshot({
      path: path.join(outDir, `${post.name}.png`),
      clip: { x: 0, y: top, width: S, height: S },
    });
    console.log(`  ${post.name.padEnd(10)} ${post.about}`);
  }

  await browser.close();
  console.log(`\n${POSTS.length} posts in ${outDir}`);
})().catch((e) => { console.error(e); process.exit(1); });
