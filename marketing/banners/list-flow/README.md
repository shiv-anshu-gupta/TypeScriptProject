# List-flow promo banner

Home-screen banner explaining the grocery-list flow: write the list, send it,
get the shop's price back, come and collect.

- **Upload this:** `banner.jpg` (1600×736, ~160 KB) in the admin panel under
  **Settings → Banners**. `banner.png` is the lossless master.
- Size is 1600×736 on purpose: the app shows banners at a 0.46 height/width
  ratio (`BannerCarousel`), so nothing gets cropped.

## Editing and re-rendering

Everything is in `banner.html` (SVG illustration + HTML text). To regenerate
the images after an edit:

```
npm i puppeteer-core
node render.cjs
```

`render.cjs` drives the locally installed Chrome and waits for the Hindi web
fonts (Baloo 2, Mukta, Kalam) to load before capturing, so the Devanagari never
falls back to a system font.
