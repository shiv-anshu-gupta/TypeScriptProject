// Renders banner.html to PNG + JPEG at the app's banner ratio (0.46 -> 1600x736).
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const W = 1600;
const H = 736; // 1600 * 0.46 - BannerCarousel's ASPECT, so the app crops nothing

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  const file = "file:///" + path.resolve(__dirname, "banner.html").replace(/\\/g, "/");
  await page.goto(file, { waitUntil: "networkidle0", timeout: 60000 });

  // Web fonts load lazily per subset; wait until every face in use has loaded,
  // otherwise Chrome silently falls back and the Hindi renders in a system font.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const fonts = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === "loaded")
      .map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`),
  );
  console.log("fonts loaded:", [...new Set(fonts)].join(", ") || "NONE");

  const clip = { x: 0, y: 0, width: W, height: H };
  await page.screenshot({ path: path.join(__dirname, "banner.png"), clip });
  await page.screenshot({
    path: path.join(__dirname, "banner.jpg"),
    type: "jpeg",
    quality: 90,
    clip,
  });
  await browser.close();
  console.log("rendered banner.png + banner.jpg");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
