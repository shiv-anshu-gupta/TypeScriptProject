# Runbook

Symptom, evidence, cause, fix. Every entry below has actually happened.

Work top-down within an entry: **collect the evidence before changing
anything.** Several of these symptoms have more than one cause and look
identical from the outside, so a guess costs a deploy and tells you nothing.

## Before anything else

```bash
curl -i https://<server-host>/health
```

A 200 proves the process is up and that MongoDB was reachable **at boot** — the
listener only starts after `connectDB()` resolves. It does **not** re-check the
connection per call, so a healthy `/health` does not rule out a database
problem now.

Then: Vercel → the server project → Logs. That is the only place a server
stack trace exists. There is no error-tracking service; see
[Monitoring](monitoring.md).

---

## The app or the panel shows "Internal server error" {#internal-error}

That exact string comes from our own error handler
(`server/src/middleware/errorhandler.ts`), so it means one thing precisely:
**the server threw something that was not an `AppError`.** The customer's
message is deliberately useless; the real information is in the log.

**Evidence to collect first**

1. Vercel → server project → Logs. Filter to the minute it happened. Look for
   the line `error` followed by a stack — the handler logs the whole thing
   before answering.
2. The request path and method from the same log line (morgan logs every
   request).
3. Whether it is every request or one route.

**Likely causes**

| Cause | What the stack shows |
|---|---|
| A Mongoose validation error reaching the handler | `ValidationError`, naming the field. A list created with `totalItems: 0` against a schema demanding at least 1 did exactly this. |
| A `CastError` from a malformed id | `CastError: Cast to ObjectId failed`. A bad `:listId` in a URL reaches Mongoose and surfaces as a 500, not a 400. |
| An external call failing inside a route that does not wrap it | Cloudinary or Gemini in the frame |
| A multer limit on the **product** upload route | `MulterError: File too large`. Only the `fileFilter` rejection is an `AppError` there; the limit errors are not. |

**What to do**

Fix forward. Throw an `AppError` with a message the customer can act on:

```ts
throw new AppError(400, "That list could not be found — try opening it again.");
```

A 500 is a bug report, not an operating state. If the whole server is 500ing,
check the boot path instead: a missing `MONGO_URI` exits the process, and a
missing `RAZORPAY_KEY_ID` throws at import time and stops everything.

---

## The admin panel is blank, or loops back to sign-in {#blank-admin}

**Evidence to collect first**

1. Open the browser console and the network tab, then reload.
2. Which is it?
    - Requests show **"Network Error"** or are missing CORS headers → CORS.
    - Requests return **401** → a token problem.
    - Requests return **403 "Admin access only"** → a role problem.
    - No requests at all, blank white page → a bundle or Clerk key problem.
3. What the page itself says. The panel has two specific screens:
   **"Couldn't reach the shop server"** and **"Admin access only"**.

**Likely causes and fixes**

| Evidence | Cause | Fix |
|---|---|---|
| "Network Error" under "Couldn't reach the shop server" | The origin is not in `CORS_ORIGINS` | Add it — including the `www.` form — to the **server** project and **redeploy that project**. Matching is exact on scheme, host and port: no wildcards, no trailing slash. |
| 403 "Admin access only" | The account has no admin role | Add the email to `ADMIN_EMAILS`, redeploy the server, sign out and in again. The role is granted during `POST /auth/sync`, not on page load. |
| Blank page, no requests | `VITE_CLERK_PUBLISHABLE_KEY` wrong, missing, or from the wrong Clerk instance | Fix it in Vercel and **redeploy the admin project** — `VITE_` values are baked into the bundle at build time |
| Requests going to `localhost:5000` | `VITE_BACKEND_URL` unset in the build | It falls back to localhost silently, with no warning. Set it and redeploy. |
| "Couldn't reach the shop server", no CORS smell | `POST /auth/sync` or `GET /auth/me` failed | The raw message is printed under the heading. There is no retry — **Try again** reloads the page. |

!!! note "A CORS failure never looks like a CORS failure"
    The browser discards the response before axios sees it, so all that
    reaches the code is the string `"Network Error"`. If someone reports that
    message, check `CORS_ORIGINS` before anything else.

---

## A customer cannot sign in, or the login screen returns after signing in {#sign-in-loop}

**Evidence to collect first**

1. Which path — Google, or the email code? Both funnel through the same guard,
   so if only one fails the problem is in Clerk's provider configuration.
2. The device log. The app logs
   `[auth] cleared a pending Clerk session (task: …)` when it clears one, and
   the task key names what Clerk is waiting for.
3. Clerk dashboard → the **production** instance → Users: was a session
   created at all?

**Likely causes**

| Cause | Sign |
|---|---|
| A **pending** session — Clerk is holding it until the person completes a task the app has no screen for | The task key in the log. Retries fail with `session_exists`. |
| Mismatched keys between app, panel and server | Sign-in fails everywhere at once, right after a key change |
| A live key on localhost, or a test key in production | Development only, or a bundle built from the wrong env file |
| An OTA that carried a stale key | Google's consent screen says "continue to clerk.skirana.com" rather than "sKirana" |

**What to do**

The app already clears a pending session and reports it
(`mobile/src/lib/clerk-session.ts`), and the login panel clears one as soon as
it appears. **The real fix is in the Clerk dashboard.** The known cause was
**Organizations** switched on with "membership required" in the production
instance, which development did not have. It was turned off on 15 Sept.

If pending sessions return, compare `/v1/environment` on both instances and
look at `organization_settings.force_organization_selection`. Cloning an
instance does not guarantee identical settings — that is how this happened.

`session_exists` on its own is not a fault: the device already holds a session,
and `recoverExisting` either adopts it or signs the device out so the next
attempt starts clean.

---

## "User is not found in the DB" {#user-not-found}

The Clerk user id has no matching `users` document and re-linking did not
happen.

**Evidence to collect first**

1. Vercel logs → search for `E11000`. That is MongoDB refusing a duplicate
   `email`.
2. Search for `[user-sync] re-linked` around the same time. Its presence means
   re-linking worked for someone; its absence for this customer means it did
   not.
3. Ask the customer which email they signed in with, and check whether that
   email is **verified** on their Clerk account.

**Cause**

`syncDbUser` only re-links a record when the email is **verified** on the new
account — otherwise anyone could claim someone else's order history. An
unverified email hits the unique index instead and surfaces as
**409 "This email is already used by another sKirana account. Please contact
the shop."**

**What to do**

Get the email verified in Clerk, then have the customer sign in again; the
re-link happens on the next `POST /auth/sync`. Failing that, a manual database
edit is the only route. Read
[the re-linking rule](../explain/auth.md#re-linking) before touching anything —
the `users` collection has unique indexes on both `clerkUserId` and `email`.

---

## Product images are blank {#blank-images}

**Evidence to collect first**

1. Is it **all** images or **some**? All → delivery or configuration. Some,
   and only after scrolling → the recycling bug.
2. Does the image URL open in a browser? Copy one from the API response.
3. Which screen — the Shop grid (a recycling list) or a detail screen (not)?

**Likely causes**

| Evidence | Cause | Fix |
|---|---|---|
| Blanks appear as you scroll back up the Shop grid | `expo-image` leaves the view blank when the source changes mid cross-fade — expo/expo#35664 | **Do not add `transition` to a list image on SDK 54.** `ProductCard` deliberately has none. Fixed in expo-image 56.0.11; SDK 54 pins 3.0.11. |
| Blank from the start, URL 404s in a browser | A bad `publicId`, or the image was deleted from Cloudinary | The stored URL is the master; re-upload |
| Everything blank, URLs look right | Cloudinary credits exhausted | See [Limits](limits.md) |
| Blank only in the admin panel | `client/src/lib/image.ts` returns the original file on several paths; check the upload rather than the delivery | — |

---

## The Shop screen feels slow {#slow-shop}

**Evidence to collect first**

1. Is it slow on **first** load, or on **scroll back up**?
2. How big is the product list response? `GET /customer/products` is
   unpaginated.
3. Atlas → Metrics → is the query scanning?

**Likely causes**

| Evidence | Cause | Fix |
|---|---|---|
| Slow on scroll back up | `cachePolicy` defaulting to `disk` only, so every picture is re-read and re-decoded | List images must set `cachePolicy="memory-disk"` |
| Slow on first load, large response | Images served larger than they are drawn | Check the delivery URL carries `f_webp,q_auto,c_limit,w_500` for a card. A 20-card grid was **19.4 MB** before this and **0.64 MB** after. |
| Slow at the database | A query with no matching index | `Product` declares three compound indexes. A `keysExamined: 0` on Atlas means a collection scan feeding a blocking sort — which is exactly what was measured before those indexes existed. |
| Slow, and every card re-renders | A sheet mounted per card | A sheet is not free while closed. The quantity sheet is mounted **once** at the root; cards call `useQuantitySheetStore.open(...)`. |

An index declared in a model only exists in the database once a process
carrying that model has connected and `autoIndex` has run. Verify against the
live cluster rather than reading the model file.

---

## Reading a list photo fails {#photo-fails}

**Evidence to collect first**

1. The status code and the message — they are specific, and each one names its
   cause.
2. Vercel logs for the request.

**The messages, and what each means**

| Status | Message | Cause | Fix |
|---|---|---|---|
| 503 | "Reading photos isn't switched on yet. Please type the items instead." | `GEMINI_API_KEY` is unset | Set it on the server project and **redeploy** |
| 429 | "Your photo is still being read — one moment." | That customer already has a read in flight | Nothing. Working as designed. |
| 429 | "Just a moment before the next photo." | Less than 5 seconds since that customer's previous read finished | Nothing |
| 503 | "A lot of lists are being read right now. Try again in a minute, or type the items." | 12 reads already in the current minute, across this process | Nothing, unless it is constant — then see [Limits](limits.md) |
| 503 | "The photo reader is busy right now. Try again in a minute, or type the items." | Gemini answered 429 — the free tier's own limit | Wait, or move off the free tier |
| 503 | "Could not reach the photo-reading service. Check the internet and try again." | The call failed, or the 45-second abort fired | Usually transient. If persistent, raise Vercel's **Max Duration** — a read takes 10–20 s. |
| 503 | "The photo could not be read just now. Try again, or type the items." | Any other Gemini failure, or the reply failed schema validation | Check the log for the raw response |
| 400 | "Choose at least one photo" | The multipart body carried no `photos` part | A client bug |
| 400 | "Each photo must be under 6 MB" | Multer's size limit | — |

!!! note "`readable: false` is a 200, not an error"
    When the model cannot read the photo, or nothing survives cleaning, the
    endpoint answers **200** with `{ readable: false, items: [] }`. A client
    must check the flag, not the status code. That is not a failure to
    investigate.

The rate limits are **per process** and Vercel runs several, so the real
ceiling is higher than the numbers suggest. They are a brake on cost, not a
security boundary.

---

## An OTA did not reach a phone {#ota-missing}

**Evidence to collect first**

1. The app version installed on that phone, from the Account screen or the Play
   listing.
2. `eas update:list --branch production` — was the update published, and from
   which runtime version?
3. How many times has the phone been launched since?

**Likely causes, in the order they are usually true**

| Cause | Check |
|---|---|
| Only one launch since publishing | An OTA applies on the **second** launch. The first downloads it in the background. |
| The runtime versions do not match | `runtimeVersion` follows `version` in `app.json`. A build of 1.0.3 never receives a 1.0.4 update — no exceptions and no error. |
| Published to the wrong branch | `npm run ota` publishes to `production`; the production build profile subscribes to the `production` channel |
| The preflight refused | It exits 1 and `eas update` never runs. Read the terminal output: it names the key that failed. |

There is no mechanism that reports a non-delivery. Absence of a complaint is
not evidence of delivery.

---

## The screen goes black, or a sheet does not open {#black-screen}

Both have happened, both from the same area.

**Evidence to collect first**

1. Device logs — `adb logcat` on Android, filtered to the app.
2. Does the app recover on relaunch? A black screen from a render-time
   exception does; a native crash does not.
3. Which sheet, and what does it contain?

**Likely causes**

| Symptom | Cause | Fix |
|---|---|---|
| A black screen after opening a sheet | A **render-time exception** took the React tree down. The known case: sheet contents calling `useNavigation()` while the portal host sat outside `NavigationContainer`. | Already fixed two ways: `PortalProvider` is inside `NavigationContainer` (`mobile/App.tsx`), and sheet contents render behind the `SheetContentGuard` error boundary, which shows a message instead of a black screen. If you see a black screen again, something is rendering outside that boundary. |
| A sheet that never opens | `@gorhom/bottom-sheet` v5 does not work with Reanimated 4 (Expo SDK 54) | The app's sheet is hand-written for exactly this reason: `mobile/src/components/ui/Sheet.tsx`. Do not reintroduce the library. |
| The login opens "behind" a sheet on Android | The sheet is drawn over the whole app | Close the sheet **before** navigating |

---

## An order never reached the shop {#order-missing}

**Evidence to collect first**

1. Does the list exist in the database? Ask the customer for the eight-character
   code — it is the last eight characters of the `_id`, upper-cased.
2. Did Telegram get an alert?
3. Is the panel's 15-second poll running — does a manual refresh show it?

**Likely causes**

| Evidence | Cause |
|---|---|
| The list exists, the panel does not show it until refreshed | The background poll failed. **A failed poll shows no error** and leaves the previous data on screen — a server outage looks like a quiet shop. |
| The list exists, no Telegram alert | `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` unset, or the customer's text contained a raw `<` or `&`, which Telegram rejects under `parse_mode: "HTML"` |
| The list exists, no browser alert | Firebase not configured, or the shopkeeper's browser has no permission. `notifyAdmins` is a **silent** no-op when the three `FIREBASE_*` variables are missing — nothing is logged and nothing throws. |
| The customer sent two lists and the shop sees one | Correct behaviour. A second send within six hours is merged. See [the merge window](../explain/list-lifecycle.md#merge-window). |
| The customer says they sent it, nothing exists | An unsent draft. The draft lives only on the phone; the Home card's `send` stage exists precisely because of this. |

---

## A customer got no notification {#no-push}

Push is best-effort throughout. Every send swallows its own failure, so **the
absence of an error proves nothing**.

| Check | Where |
|---|---|
| Does the customer's record have any `pushTokens`? | The `users` document. Empty means they never granted permission or the token was handed back at sign-out. |
| Did the app fail to register? | The device log carries a developer-English `reason` from `registerForPushNotificationsAsync` — not a device, permission refused, no `projectId` |
| Did the list actually change? | `seenByCustomer: false` and a fresh timestamp prove the write happened even if the push did not |
| Is the token stale? | Expo's per-ticket results are not inspected, so a retired token is not pruned |

The list still moves either way. Push failing is an inconvenience, not an
incident.

---

## Quick reference

| Symptom | First place to look |
|---|---|
| "Internal server error" | Vercel server logs — the stack is there |
| Blank panel, "Network Error" | `CORS_ORIGINS` on the **server** project |
| Blank panel, no requests | `VITE_CLERK_PUBLISHABLE_KEY`, then redeploy the **admin** project |
| Sign-in loop | Clerk dashboard — Organizations, and pending sessions |
| "User is not found in the DB" | Vercel logs for `E11000` and `[user-sync]` |
| Blank images in a list | `transition` on a recycled image |
| Slow scroll-back | `cachePolicy` |
| Photo read fails | The message — each one names its cause |
| OTA missing | Launch count, then `runtimeVersion` |
| Black screen | Device logs; something rendering outside the sheet's error boundary |
