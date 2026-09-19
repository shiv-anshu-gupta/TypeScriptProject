# Limits

Every platform here is on a free or near-free tier, and several design
decisions exist only because of that. This page lists each limit, what happens
when it is reached, and roughly where usage sits today.

!!! note "Where the usage figures come from"
    Document counts are the snapshot recorded in `docs/DATA-MODEL.md`, taken
    from the live database. They will have moved. Bandwidth and quota figures
    are **not** measured — they are estimates from the code's own behaviour,
    and are marked **unverified** where that matters. Check the provider's own
    dashboard before making a decision on one of them.

## At a glance

| Platform | Limit | Where usage sits | What happens at the limit |
|---|---|---|---|
| Vercel response body | ~4.5 MB | 84 products | The response is truncated or refused at the edge |
| Vercel function duration | A project setting | A photo read takes 10–20 s | The request is killed; the client sees a timeout |
| MongoDB Atlas M0 | 512 MB, shared CPU | ~300 documents in total | Writes are refused; queries slow under contention |
| Cloudinary free | 25 credits/month | Unverified | Delivery stops for the rest of the month |
| Gemini free tier | ~10–15 requests/minute | Well under, with brakes in place | 429, surfaced as a plain 503 message |
| Expo push | Free | Unmetered in practice | — |

---

## Vercel: the response body {#vercel-body}

A serverless response is capped at roughly **4.5 MB**.

**What is exposed to it**

Several endpoints are unpaginated by design:

| Endpoint | Returns |
|---|---|
| `GET /customer/products` | Every active product, no pagination, no limit |
| `GET /customer/grocery-lists` | Every list the customer has ever sent, no date cut-off |
| `GET /admin/grocery-lists` | **Every list in the database**, completed and cancelled included |

**Where it sits**

84 products and 130 grocery lists. The product list is estimated to reach 4.5 MB
at around **5,000 products** — far off. The admin list is the one that grows
without bound, because it grows with every order the shop has ever taken, and
seven of the ten admin mutation routes return the whole collection again.

**What happens**

The request fails at the edge, before any application code runs. There is no
CORS header on that failure, so the panel reports `"Network Error"` and the
logs show nothing useful.

**What to do about it**

Pagination on `GET /admin/grocery-lists` is the first change worth making when
list volume grows — a `status` filter and a date window, both of which the
existing `{ status: 1, createdAt: -1 }` index already supports.

## Vercel: function duration {#vercel-duration}

**What is exposed to it**

Reading a photograph. The call to Gemini alone takes **10–20 seconds**, and the
code allows it **45 seconds** (`MODEL_TIMEOUT_MS`) before aborting.

**What happens**

Vercel kills the function. The client sees its own timeout — the mobile app
raises the photo-read call to 60 seconds, from a 20-second default, precisely
for this.

**What to do**

Vercel → server project → Settings → Functions → raise **Max Duration**. This
is a known item on the production setup's outstanding list.

## MongoDB Atlas M0 {#atlas}

Shared CPU, **512 MB** of storage.

**Where it sits**

| Collection | Documents |
|---|---|
| `grocerylists` | 130 |
| `products` | 84 |
| `messages` | 35 |
| `users` | 32 |
| `categories` | 13 |
| `banners` | 4 |
| `wishlists` | 4 |
| `promos` | 3 |
| `carts` | 2 |
| `orders` | 1 |

Nowhere near the storage limit. The pressure on a shared-CPU tier is **query
shape**, not size.

**What happens**

An unindexed collection scan is felt immediately. The measured example: before
`Product` gained its three compound indexes, the catalogue query reported
`keysExamined: 0` — a full collection scan feeding a blocking sort.

**What keeps it under control**

| Collection | Indexes | Why |
|---|---|---|
| `grocerylists` | `{ user: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }` | The only two ways a list is ever looked for. The sort field is last in each, so the index satisfies the sort too and the database never orders the results itself. |
| `products` | Three compound indexes fronted by `status` | Every catalogue query is pinned to `status: "active"` |
| `messages` | `{ groceryList: 1, createdAt: 1 }`, plus a TTL index | The TTL deletes each message 30 days after writing — the only automatic cleanup in the system |
| `users` | Unique on `clerkUserId` and on `email` | Identity lookups, and the re-linking rule |

!!! warning "A declared index may not exist"
    An index appears in the database only when a process carrying that model
    connects and `autoIndex` runs. Verify against the live cluster rather than
    reading the model file.

## Cloudinary free tier {#cloudinary}

**25 credits per month.** One credit is roughly 1 GB of delivery bandwidth, or
1,000 transformations, or 1 GB of storage.

**What is exposed to it**

Every product, category and banner image the app and the panel draw. Delivery
dominates; the shop's catalogue is 84 products and changes rarely.

**What keeps it under control** — and this is why the image pipeline looks the
way it does:

| Decision | Effect |
|---|---|
| Images are asked for at the size they are drawn | A 20-card grid measured **19.4 MB → 0.64 MB** |
| `f_webp` rather than `f_auto` | About a third fewer bytes per card: 22.8 KB rather than 33.7 KB |
| **No `dpr_auto`** | It would bill a **separate derivative** for every screen density of the same picture |
| Uploads bounded to 1600 px | Caps stored size and the cost of each derivative |

**Where it sits** — **unverified.** Nothing in this repository measures
Cloudinary usage. Check the Cloudinary dashboard; see
[Monitoring](monitoring.md).

**What happens at the limit**

Delivery stops for the rest of the billing month. Every product image goes
blank at once, across both clients. That is the distinguishing evidence: *all*
images failing, with URLs that still look correct.

**Changing a variant width bills fresh derivatives** at the new width, for
every image. It is a cheap code change and a real cost.

## Gemini free tier {#gemini}

Roughly **10–15 requests per minute**.

**What keeps it under control**

`server/src/services/photo-list-parser.ts` brakes in two places:

| Brake | Value | Message when it fires |
|---|---|---|
| Per customer, one read at a time | — | 429 "Your photo is still being read — one moment." |
| Per customer, a gap after the previous read **finished** | `USER_GAP_MS` = 5 s | 429 "Just a moment before the next photo." |
| Whole server, per minute | `GLOBAL_LIMIT_PER_MIN` = 12 | 503 "A lot of lists are being read right now. Try again in a minute, or type the items." |

The gap is measured from when the previous read **finished**, not when it
started — a read takes about ten seconds, so a gap timed from the start would
already have elapsed by the time the customer could tap again, and would brake
nothing.

!!! warning "These brakes are not a boundary"
    They are held in process memory, and Vercel runs several instances, each
    with its own. The real ceiling is higher than 12 a minute, by an unknown
    multiple. They are a brake on cost, never a security control.

    Each request also costs one quota unit regardless of how many photos it
    carries, up to three — which is why all the photos of one list go in a
    single call.

**What happens at the limit**

Gemini answers 429, and the customer sees 503 "The photo reader is busy right
now. Try again in a minute, or type the items." Typing still works, so this
degrades rather than breaks.

## Expo push {#expo}

Free, delivered through FCM.

**What happens**

Nothing is metered in practice. The relevant failure is per-token, not
per-quota: a token Expo has retired is **not** pruned, because the code does
not inspect Expo's per-ticket results. Tokens that do not look like Expo tokens
are dropped before sending, and duplicates are collapsed.

Firebase web push, for the shop's browser, does prune: tokens FCM reports as
permanently dead are pulled from every admin record.

---

## The limits this system sets on itself

Not platform limits, but they shape behaviour just as much.

| Limit | Value | Where |
|---|---|---|
| JSON request body | 100 KB | `server/src/server.ts` — a list or a chat message is tiny |
| Items in one send | 50 (`MAX_ITEMS_PER_SUBMIT`) | `server/src/utils/sanitizeItem.ts` |
| Items on one list after merges | 100 (`MAX_ITEMS_PER_LIST`) | enforced by the routes |
| Raw rows accepted before cleaning | 500 | `cleanItems` |
| Item name / quantity / note | 60 / 12 / 300 characters | `sanitizeItem.ts` |
| Chat message | 1,000 characters | `server/src/models/Message.ts` |
| Product and banner uploads | 5 MB per file, 10 files | the admin routes |
| List photos | 6 MB per file, 3 files | the customer route |
| Image stored dimension | 1600 px | both the browser and the Cloudinary upload |
| Client request timeout | 20 s, 60 s for a photo read | `mobile/src/lib/api.ts` |
| Clerk token wait | 8 s, then the request goes without one | `mobile/src/lib/api.ts` |
| Admin poll | 15 s for lists, 5 s for an open chat | the admin hooks |
| Chat retention | 30 days, by TTL index | `server/src/models/Message.ts` |

## What to watch as the shop grows

| If this grows | The first thing that hurts |
|---|---|
| Orders per day | `GET /admin/grocery-lists` — unpaginated, and returned again after almost every mutation |
| Total orders ever | The same endpoint, and the customer's own list endpoint, which has no date cut-off |
| Products | The unpaginated catalogue response, and then the Vercel body limit |
| Photo reads per minute | The Gemini free tier, then its bill |
| App installs | Cloudinary delivery credits |
| Customers with several devices | Nothing — push tokens are a small array per user |
