# A4 launch poster

One sheet announcing that the shop has an app. Print it, stick it by the
counter; a customer scans the code and lands on the Play Store listing.

| File | Use |
|---|---|
| `poster.pdf` | Give this to the printer. Vector text, exact A4, no DPI to get wrong. |
| `poster.png` | 2480x3509, A4 at 300 DPI. WhatsApp, or printing from a phone. |
| `qr.svg` | The code on its own, if you want it on a bill or a visiting card. |

## Before printing: four lines to change

They are marked **SHOP DETAIL** in `poster.html`.

1. the shop's name in the lockup
2. the line under it ("आपके मोहल्ले की किराना दुकान")
3. the address, bottom-left — currently `[दुकान का पता यहाँ]`
4. the phone number, bottom-right — currently `[फ़ोन नंबर]`

Then re-render.

```
npm i puppeteer-core qrcode   # once, in marketing/
node render.cjs
```

## About the QR

It is generated at render time from the package id, not pasted in:

```
https://play.google.com/store/apps/details?id=com.skirana.app
```

Error correction is set to **H**, the highest, because a poster on a shop wall
gets scuffed, taped over at a corner and photographed at an angle - at H a
quarter of the code can be unreadable and it still scans.

`render.cjs` refuses to produce a poster if the code did not make it into the
page, which it did once: the page fetches `qr.svg`, and Chrome blocks fetch on
a `file://` page. A poster whose only job is to be scanned must not ship
without a code, so the renderer injects it directly and then checks.

**Scan it yourself once before printing a hundred.** The destination was
checked and answers 200, but your phone is the only thing that proves the
printed code reads.
