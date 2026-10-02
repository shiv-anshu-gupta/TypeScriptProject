# Launch posts — two days, two posters

| File | Put it up | What it does |
|---|---|---|
| `out/1-teaser.png` | **today** | says something is coming, and deliberately not what |
| `out/2-live.png` | **tomorrow** | answers it, with the QR |

Both 1080×1080 — WhatsApp status, Instagram feed, a shop's own notice board.

## Why the teaser carries no QR

It is the one thing a teaser owns: the question it leaves open. A code, a
store badge or the app's purpose on that post answers it a day early and
turns the pair into one post printed twice.

So the first says *"कल से लाइन में लगना बंद"* and stops there. The phone is on
it, but under wraps — a shape with a question mark, no screen.

The second shows the screen, the prices, the total, and how to get it.

## Posting them

Put the teaser up in the morning and leave it the whole day. Tell people at
the counter to look tomorrow — the badge on the poster says exactly that.
Put the second up the next morning, and pin it.

## Editing

Everything is in `launch.html`: two `<section>`s, one colour each. The shop's
name appears twice, in the `.brand` block of each post.

```
npm i puppeteer-core qrcode   # once, in marketing/
node render.cjs
```

The renderer fails rather than producing a post whose QR did not render, and
rather than one whose headline fell back to a system font — both of which are
invisible until after it is posted.
