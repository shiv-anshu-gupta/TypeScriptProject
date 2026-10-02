// Renders the A4 launch poster.
//
// Two outputs, because they are used in two different ways:
//   poster.pdf  - give this to the printer. Vector text, exact A4, no DPI.
//   poster.png  - 300 DPI, for WhatsApp and for a shop that prints from a
//                 phone. 2480x3508, which is what A4 at 300 DPI is.
//
// The QR is regenerated here from the real Play Store URL, so the poster can
// never carry a stale code: change the package id and the code changes with it.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const QRCode = require("qrcode");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PACKAGE = "com.skirana.app";
const PLAY_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}`;

// The sheet is laid out in millimetres, so the viewport has to be its CSS
// size - 210mm is 793.7 CSS px at the 96 DPI the browser assumes - and the
// scale factor does the rest. Setting the viewport to 2480 instead left the
// poster sitting in the corner of a page eight times too big.
const CSS_W = 794;   // 210mm
const CSS_H = 1123;  // 297mm
const SCALE = 3.125; // -> 2480 x 3509, which is A4 at 300 DPI

(async () => {
  // H: the highest error correction, because a poster on a shop wall gets
  // scuffed, taped over a corner, and photographed at an angle.
  const svg = await QRCode.toString(PLAY_URL, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#1f2a2e", light: "#ffffff" },
  });
  fs.writeFileSync(path.join(__dirname, "qr.svg"), svg);
  console.log("QR  ->", PLAY_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: SCALE });

  const file = "file:///" + path.resolve(__dirname, "poster.html").split("\\").join("/");
  await page.goto(file, { waitUntil: "networkidle0", timeout: 60000 });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  });
  const fams = await page.evaluate(() => [
    ...new Set(
      [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
    ),
  ]);
  console.log("fonts:", fams.join(", ") || "NONE");
  if (!fams.includes("Baloo 2")) {
    throw new Error("Baloo 2 did not load - the headline would print in a fallback face");
  }

  // Put the QR in directly. The page also fetches qr.svg so that opening it
  // in a browser shows one, but Chrome blocks fetch on a file:// page - and
  // this render runs from file://. Injecting is what makes it certain.
  await page.evaluate((markup) => {
    document.getElementById("qr").innerHTML = markup;
  }, svg);

  // The four illustrations load as <img>; an SVG that failed to load is an
  // invisible hole, not an error, so count them before printing.
  const art = await page.evaluate(() =>
    [...document.querySelectorAll(".sheet img")].map((i) => i.naturalWidth > 0));
  if (!art.length || art.some((ok) => !ok)) {
    throw new Error(`art: ${art.filter(Boolean).length} of ${art.length} images loaded`);
  }
  console.log(`art: all ${art.length} images loaded`);

  // A poster whose whole job is to be scanned must not go out without a code.
  const qrOk = await page.evaluate(() => !!document.querySelector("#qr svg"));
  if (!qrOk) throw new Error("the QR did not render into the page");

  // Nothing may run off the sheet. A4 does not scroll, and the overflow is
  // silently clipped - the address line had already been cut off once, and
  // the only sign was that it was missing from a poster otherwise fine.
  const fit = await page.evaluate(() => {
    const sheet = document.querySelector(".sheet").getBoundingClientRect();
    const last = document.querySelector(".foot").getBoundingClientRect();
    return { sheetBottom: sheet.bottom, lastBottom: last.bottom };
  });
  // 2px of tolerance: millimetre lengths do not land on whole CSS pixels, so
  // the last line sits a fraction past the border box even when it prints
  // fine. Anything beyond that is a real clip.
  if (fit.lastBottom > fit.sheetBottom + 2) {
    throw new Error(
      `content runs ${Math.round(fit.lastBottom - fit.sheetBottom)}px past the bottom of the sheet`,
    );
  }
  console.log(
    `fit: ${Math.round(fit.sheetBottom - fit.lastBottom)}px of margin below the last line`,
  );

  await page.pdf({
    path: path.join(__dirname, "poster.pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await page.screenshot({
    path: path.join(__dirname, "poster.png"),
    clip: { x: 0, y: 0, width: CSS_W, height: CSS_H },
  });

  await browser.close();
  console.log("poster.pdf (print) + poster.png (300 DPI)");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
