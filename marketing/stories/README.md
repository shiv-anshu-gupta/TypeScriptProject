# Story creatives — install campaign

Three frames for Instagram / WhatsApp stories, built from the app's own colours
and its own screens. `out/` holds what you post.

| File | What it does | Post it |
|---|---|---|
| `story-1-hook.png` | The promise, one phone, one button | First. Always. |
| `story-2-flow.png` | The three steps, as three real screens | Second |
| `story-3-trust.png` | Why this and not a delivery app | Third |
| `square-*.png` | 1:1 crop of each, from the middle band | WhatsApp status, feed posts |

Stories are 1080×1920, squares are 1080×1080.

## Why they are built this way

The structure follows what app-install creative research says works, not taste:

- **The first frame carries the campaign.** Everyone sees it; most see nothing
  else. It makes one specific promise — *"सूची भेजिए, दाम आपके दुकानदार से
  आएँगे"* — rather than claiming to be the best grocery app. A caption that
  survives at thumbnail size beats a clever one that does not.
- **Show, don't describe.** Frame 2 is three real screens. A customer who has
  never seen the app knows what using it looks like before they install it.
- **9:16 is the master**; the square is cropped from its middle. Design once.
- **Safe area.** Instagram and WhatsApp paint their own UI over roughly the top
  250px and bottom 320px. Everything that must be read sits between them, which
  is why the frames are centred rather than filling the page. Open
  `stories.html?guides=1` to see that band drawn.

## Editing

Everything is in `stories.html` — no images, no assets. The phone screens are
the real components rebuilt in HTML, so they stay sharp at any size and change
when you change the markup.

To swap the words, edit the `<h1>`, `.sub` and `.point` text. To change the
colours, they are the app's tokens at the top of the file, same values as
`marketing/mood-board`.

```
npm i puppeteer-core     # once, in marketing/
node render.cjs
```

`render.cjs` drives the locally installed Chrome, waits for the Devanagari web
fonts to finish loading, and **fails loudly if Baloo 2 did not load** — otherwise
Chrome falls back silently and the headline ships in the wrong face, which is
the kind of defect nobody sees until it is already posted.

## What is deliberately missing

- **No three.js, no WebGL.** The output is a still image. A 3D phone would cost
  a renderer, a headless GPU and a pile of nondeterminism to produce something a
  CSS `rotate(-4deg)` already does, pixel-identical on every run.
- **No photographs.** Nothing here needs one, and the ones worth using are the
  shop's own, which can be added as `<img>` when they exist.
- **No claims the shop cannot keep.** Every line on frame 3 is how the product
  actually works: the shopkeeper sets the prices, there is no delivery, payment
  happens at the counter, and the list can be written in Hindi.
