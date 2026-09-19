# Banner status `banner-status`

Banner shape constants, upload limits, and the local rules that decide what the app will do with each banner.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/settings/banner-status.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 11 |

## Description

Nothing here calls the server. `bannerStatuses` reproduces the app's own
selection rules in the browser so the admin page can show, before any
request, which banners are live and which are not.

The size and type constants are also the uploader's validation limits. The
server enforces matching caps for banners
(`server/src/routes/admin/settings.routes.ts`), which is not true of product
images — banners are the correctly-gated upload path.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BANNER_HEIGHT`](#constant-banner-height) | Constant | `const BANNER_HEIGHT: 736` | Target banner height in pixels, paired with [`BANNER_WIDTH`](#constant-banner-width). |
| [`BANNER_RATIO`](#constant-banner-ratio) | Constant | `const BANNER_RATIO: number` | Banner height divided by width, 0.46. |
| [`BANNER_TYPES`](#constant-banner-types) | Constant | `const BANNER_TYPES: string[]` | Accepted MIME types. |
| [`BANNER_WIDTH`](#constant-banner-width) | Constant | `const BANNER_WIDTH: 1600` | Target banner width in pixels. |
| [`bannerStatuses`](#function-banner-statuses) | Function | `function bannerStatuses(items: AdminBanner[], limit: number, now: Date): BannerStatus[]` | Works out the status of every banner, in list order. |
| [`fromLocalInput`](#function-from-local-input) | Function | `function fromLocalInput(value: string): string \| null` | Converts a `datetime-local` input value back to an ISO timestamp. |
| [`LINK_LABELS`](#constant-link-labels) | Constant | `const LINK_LABELS: Record<BannerLinkType, string>` | Human labels for each link type, shown in the edit dialog's dropdown and reused by [`linkSummary`](#function-link-summary). |
| [`linkSummary`](#function-link-summary) | Function | `function linkSummary(banner: AdminBanner): string` | One line describing what a banner opens when tapped. |
| [`MAX_BANNER_BYTES`](#constant-max-banner-bytes) | Constant | `const MAX_BANNER_BYTES: number` | Per-file upload ceiling, 5 MB. |
| [`scheduleSummary`](#function-schedule-summary) | Function | `function scheduleSummary(banner: AdminBanner): string` | One line describing when a banner shows. |
| [`toLocalInput`](#function-to-local-input) | Function | `function toLocalInput(iso: string \| null): string` | Converts a stored ISO timestamp into a value for `<input type="datetime-local">`. |

## Exports in detail

### `BANNER_HEIGHT` {#constant-banner-height}

*Constant*

Target banner height in pixels, paired with [`BANNER_WIDTH`](#constant-banner-width).

```ts
const BANNER_HEIGHT: 736
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L32)

### `BANNER_RATIO` {#constant-banner-ratio}

*Constant*

Banner height divided by width, 0.46.

```ts
const BANNER_RATIO: number
```

Used by the uploader to judge how far off a picked file's shape is, and by
the phone preview to size each slide from its width.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L41)

### `BANNER_TYPES` {#constant-banner-types}

*Constant*

Accepted MIME types.

```ts
const BANNER_TYPES: string[]
```

Doubles as the file input's `accept` attribute and as the uploader's blocking
type check. The server checks the same three types, but from the
client-declared MIME type — there is no magic-byte sniffing.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L64)

### `BANNER_WIDTH` {#constant-banner-width}

*Constant*

Target banner width in pixels.

```ts
const BANNER_WIDTH: 1600
```

Advisory, not enforced: a narrower image only produces a warning in the
uploader, because the app crops to fit. Also used as the `aspect-ratio`
numerator in every banner thumbnail.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L29)

### `bannerStatuses` {#function-banner-statuses}

*Function*

Works out the status of every banner, in list order.

```ts
function bannerStatuses(items: AdminBanner[], limit: number, now: Date): BannerStatus[]
```

| Parameter | Type | Meaning |
|---|---|---|
| `items` | `AdminBanner[]` | Banners in their stored order; order decides which live banner falls past the limit. |
| `limit` | `number` | Live banners the app's carousel shows, taken from the server's response (8 at the time of writing) with 8 as the client fallback. |
| `now?` | `Date` | Reference time, injectable for tests. It defaults at call time, so a memoised result does not re-evaluate schedules on its own. |

**Returns** `BannerStatus[]` &mdash; One status per banner, positionally aligned with `items`.

Computed entirely in the browser — the server never sends a status. The rules
are checked in order: inactive is `hidden`; a future `startsAt` is
`scheduled`; a past-or-equal `endsAt` is `ended`; otherwise it counts as live.
A banner with neither date set is live as soon as it is active.

Live banners are counted as they are found, and any beyond `limit` are
reported as `overLimit`: they are switched on, but the app's carousel will not
reach them. The server does not refuse to store more than `limit` banners, so
`overLimit` exists to surface an advisory cap that nothing else enforces.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L90)

### `fromLocalInput` {#function-from-local-input}

*Function*

Converts a `datetime-local` input value back to an ISO timestamp.

```ts
function fromLocalInput(value: string): string | null
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `string` | The input's value, possibly empty. |

**Returns** `string \| null` &mdash; An ISO string, or `null` to clear the date.

`new Date(value)` reads the zone-less string as local time, so this is the
exact inverse of [`toLocalInput`](#function-to-local-input). An empty field becomes `null`, which
is what clears a schedule on the server.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L208)

### `LINK_LABELS` {#constant-link-labels}

*Constant*

Human labels for each link type, shown in the edit dialog's dropdown and
reused by [`linkSummary`](#function-link-summary).

```ts
const LINK_LABELS: Record<BannerLinkType, string>
```

Typed as a full `Record`, so adding a member to `BannerLinkType` will not
compile until a label is added here.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L109)

### `linkSummary` {#function-link-summary}

*Function*

One line describing what a banner opens when tapped.

```ts
function linkSummary(banner: AdminBanner): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `banner` | `AdminBanner` | The banner whose `link` is described. |

Fields of `banner` (`AdminBanner`):

| Field | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt` | `string` | — |
| `endsAt` | `string \| null` | — |
| `imagePublicId` | `string` | — |
| `imageUrl` | `string` | — |
| `isActive` | `boolean` | — |
| `link` | `{ type: BannerLinkType; targetId?: string; targetName?: string }` | — |
| `sortOrder` | `number` | — |
| `startsAt` | `string \| null` | — |
| `title` | `string` | — |

**Returns** `string` &mdash; Text for the banner row.

Category and product links carry a `targetName` resolved by the server. When
that name is missing the target has been deleted, and the summary says so
("Category (deleted)") rather than showing a blank — the app cannot open it
either. Every other type falls through to [`LINK_LABELS`](#constant-link-labels).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L129)

### `MAX_BANNER_BYTES` {#constant-max-banner-bytes}

*Constant*

Per-file upload ceiling, 5 MB.

```ts
const MAX_BANNER_BYTES: number
```

A blocking error in the uploader. The server applies the same 5 MB cap, so
this is a duplicate of a real limit rather than the only defence.

Banners are **not** compressed in the browser: they never go through
`client/src/lib/image.ts`, unlike product and category images. They are
validated and uploaded as-is.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L54)

### `scheduleSummary` {#function-schedule-summary}

*Function*

One line describing when a banner shows.

```ts
function scheduleSummary(banner: AdminBanner): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `banner` | `AdminBanner` | The banner whose schedule is described. |

Fields of `banner` (`AdminBanner`):

| Field | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt` | `string` | — |
| `endsAt` | `string \| null` | — |
| `imagePublicId` | `string` | — |
| `imageUrl` | `string` | — |
| `isActive` | `boolean` | — |
| `link` | `{ type: BannerLinkType; targetId?: string; targetName?: string }` | — |
| `sortOrder` | `number` | — |
| `startsAt` | `string \| null` | — |
| `title` | `string` | — |

**Returns** `string` &mdash; Text for the banner row.

Four cases: both dates give a range, one gives "From …" or "Until …", and
neither gives "Always". Dates are formatted `en-IN` with day, short month and
a 2-digit minute, in the browser's time zone — a shop device on IST reads
these as IST.

This describes the stored schedule only. Whether the banner is actually
visible also depends on `isActive` and the carousel limit; that is
[`bannerStatuses`](#function-banner-statuses).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L167)

### `toLocalInput` {#function-to-local-input}

*Function*

Converts a stored ISO timestamp into a value for
`<input type="datetime-local">`.

```ts
function toLocalInput(iso: string | null): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `iso` | `string \| null` | Stored `startsAt` or `endsAt`, or `null`. |

**Returns** `string` &mdash; A `YYYY-MM-DDTHH:mm` string, or `""`.

The input has no time zone, so the parts are read with local-time getters and
the admin sees their own clock. [`fromLocalInput`](#function-from-local-input) reverses it. `null`
becomes an empty string, which is how "no date set" is represented in the
dialog.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts#L190)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/banner-status.ts)
