/**
 * Renders assets/notification-icon.png: the Android status-bar icon.
 *
 * Android draws the small notification icon as a silhouette from its alpha
 * channel, so this is pure white on a fully transparent 96x96 canvas
 * (xxxhdpi size), a storefront: roof bar, scalloped awning, shop front with
 * two windows and a door cut out, inside 8px padding.
 *
 * Run: node scripts/make-notification-icon.cjs
 * Needs puppeteer-core (installed under marketing/node_modules) and Chrome.
 * Override with PUPPETEER_CORE=<path to puppeteer-core> and CHROME_PATH=<exe>.
 */
const path = require('path');

function loadPuppeteer() {
  const candidates = [
    process.env.PUPPETEER_CORE,
    'puppeteer-core',
    path.join(__dirname, '..', '..', 'marketing', 'node_modules', 'puppeteer-core'),
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      // try the next one
    }
  }
  throw new Error('puppeteer-core not found; set PUPPETEER_CORE to its folder');
}

const SIZE = 96;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 96 96">
  <defs>
    <mask id="front">
      <rect x="0" y="0" width="96" height="96" fill="#fff"/>
      <rect x="20" y="54" width="14" height="14" rx="2" fill="#000"/>
      <rect x="62" y="54" width="14" height="14" rx="2" fill="#000"/>
      <rect x="40" y="60" width="16" height="28" rx="2" fill="#000"/>
    </mask>
  </defs>
  <g fill="#fff">
    <!-- roof bar -->
    <rect x="12" y="8" width="72" height="8" rx="2"/>
    <!-- awning -->
    <rect x="8" y="18" width="80" height="14"/>
    <circle cx="16" cy="32" r="8"/>
    <circle cx="32" cy="32" r="8"/>
    <circle cx="48" cy="32" r="8"/>
    <circle cx="64" cy="32" r="8"/>
    <circle cx="80" cy="32" r="8"/>
    <!-- shop front with windows and door cut out -->
    <rect x="14" y="46" width="68" height="42" rx="2" mask="url(#front)"/>
  </g>
</svg>`;

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg}</body></html>`
    );
    const out = path.join(__dirname, '..', 'assets', 'notification-icon.png');
    await page.screenshot({
      path: out,
      omitBackground: true,
      clip: { x: 0, y: 0, width: SIZE, height: SIZE },
    });
    console.log('wrote', out);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
