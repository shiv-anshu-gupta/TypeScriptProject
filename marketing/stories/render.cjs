// Renders stories.html to one PNG per frame, plus a 1:1 crop of each for
// WhatsApp status and feed posts.
//
// The 9:16 is the master, as the ad guidance says: design once at story size,
// crop the square out of its middle. The square is taken from the centre band
// rather than the top, because that is where the headline and the phone sit -
// the story's own safe area already keeps them there.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const W = 1080;
const H = 1920; // 9:16 - Instagram / WhatsApp story, and the master for the rest

/** What each frame is for, in file-name order. */
const FRAMES = [
  { name: "1-hook", about: "the promise + one phone + install" },
  { name: "2-flow", about: "three steps, three screens" },
  { name: "3-trust", about: "why this and not a delivery app" },
];

(async () => {
  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H * FRAMES.length, deviceScaleFactor: 1 });

  const file = "file:///" + path.resolve(__dirname, "stories.html").replace(/\\/g, "/");
  await page.goto(file, { waitUntil: "networkidle0", timeout: 60000 });

  // Web fonts load per subset and lazily. Without this wait Chrome silently
  // falls back and the Devanagari renders in a system face - which is the one
  // defect nobody notices until the banner is already posted.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const loaded = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === "loaded")
      .map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`),
  );
  const families = [...new Set(loaded)];
  console.log("fonts loaded:", families.join(", ") || "NONE");
  if (!families.some((f) => f.startsWith("Baloo"))) {
    throw new Error("Baloo 2 did not load - the headlines would render in a fallback face");
  }

  for (const [i, frame] of FRAMES.entries()) {
    const top = i * H;

    await page.screenshot({
      path: path.join(outDir, `story-${frame.name}.png`),
      clip: { x: 0, y: top, width: W, height: H },
    });

    // 1:1 out of the middle of the same frame.
    await page.screenshot({
      path: path.join(outDir, `square-${frame.name}.png`),
      clip: { x: 0, y: top + (H - W) / 2, width: W, height: W },
    });

    console.log(`${frame.name.padEnd(8)} ${frame.about}`);
  }

  await browser.close();
  console.log(`\n${FRAMES.length * 2} images in ${outDir}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
