// Renders the four-step launch banner, 1080x1080.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const QRCode = require("qrcode");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.skirana.app";
const S = 1080;

(async () => {
  const svg = await QRCode.toString(PLAY_URL, {
    type: "svg", errorCorrectionLevel: "H", margin: 0,
    color: { dark: "#101f3d", light: "#ffffff" },
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: S, height: S, deviceScaleFactor: 2 });
  await page.goto("file:///" + path.resolve(__dirname, "banner.html").split("\\").join("/"),
    { waitUntil: "networkidle0", timeout: 60000 });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const fams = await page.evaluate(() => [...new Set([...document.fonts]
    .filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")))]);
  console.log("fonts:", fams.join(", ") || "NONE");
  if (!fams.includes("Baloo 2")) throw new Error("Baloo 2 did not load");

  await page.evaluate((m) => { document.getElementById("qr").innerHTML = m; }, svg);
  if (!(await page.evaluate(() => !!document.querySelector("#qr svg")))) {
    throw new Error("the QR did not render");
  }
  const art = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((i) => i.naturalWidth > 0));
  if (art.some((ok) => !ok)) throw new Error("an illustration did not load");

  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  await page.screenshot({
    path: path.join(__dirname, "out", "banner.png"),
    clip: { x: 0, y: 0, width: S, height: S },
  });
  await browser.close();
  console.log("out/banner.png  (1080x1080 at 2x)");
})().catch((e) => { console.error(e); process.exit(1); });
