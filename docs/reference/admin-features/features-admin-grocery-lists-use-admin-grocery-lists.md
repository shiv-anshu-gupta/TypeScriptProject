# useAdminGroceryLists `use-admin-grocery-lists`

The state behind `/admin/grocery-lists`, the screen the shop uses all day.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/grocery-lists/use-admin-grocery-lists.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

One hook owns the whole page: the polled list of orders, the three filters,
the pricing drafts, and every mutation. The page and the cards hold almost no
state of their own.

Three behaviours are worth understanding before changing anything here.

**It polls every 15 seconds.** A background poll is silent: it does not touch
the loading flag, so the page never flickers. The poll is also how a new
customer order is noticed at all — there is no socket and no server-sent
stream.

**Prices are drafts until saved.** What the shopkeeper types lives only in
this hook, keyed by list id, and is never sent until the save button is
pressed. The draft getters prefer a draft over the server's value, which is
precisely what stops the 15-second poll from wiping out half-typed prices.
Drafts are in memory only: a page reload loses them silently.

**Nothing is optimistic.** Every mutation awaits the server and replaces the
whole array with what comes back. The screen therefore lags a keystroke
behind the truth, but it can never show a change the server refused.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`StatusTab`](#type-status-tab) | Type | `type StatusTab = "active" \| "completed" \| "cancelled";` | The three tabs at the top of the page. |
| [`useAdminGroceryLists`](#hook-use-admin-grocery-lists) | Hook | `function useAdminGroceryLists(): { … }` | Loads, filters, prices and advances the shop's grocery lists. |

## Exports in detail

### `StatusTab` {#type-status-tab}

*Type*

The three tabs at the top of the page.

```ts
type StatusTab = "active" | "completed" | "cancelled";
```

"Active" is not a status — it is the group of five open ones. See
`STATUS_GROUPS`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/use-admin-grocery-lists.ts#L65)

### `useAdminGroceryLists` {#hook-use-admin-grocery-lists}

*Hook*

Loads, filters, prices and advances the shop's grocery lists.

```ts
function useAdminGroceryLists(): {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  amountReceived: string;
  setAmountReceived: Dispatch<SetStateAction<string>>;
  amountMatchCount: number;
  statusTab: StatusTab;
  setStatusTab: Dispatch<SetStateAction<StatusTab>>;
  statusCounts: { active: number; completed: number; cancelled: number };
  lists: AdminGroceryList[];
  loading: boolean;
  savingListId: string;
  refreshAll: (silent: boolean) => Promise<void>;
  getDraft: (list: AdminGroceryList) => string[];
  updateDraftPrice: (list: AdminGroceryList, index: number, value: string) => void;
  getRate: (list: AdminGroceryList) => string[];
  updateRate: (list: AdminGroceryList, index: number, value: string) => void;
  getDraftTotal: (list: AdminGroceryList) => number;
  savePrices: (list: AdminGroceryList) => Promise<void>;
  changeStatus: (listId: string, status: "ready" | "packing" | "packed" | "completed" | "cancelled") => Promise<void>;
  markPaid: (listId: string) => Promise<void>;
  setItemAvailability: (listId: string, index: number, available: boolean) => Promise<void>;
  addItem: (listId: string, name: string, quantity: string) => Promise<void>;
  editItem: (listId: string, index: number, name: string, quantity: string) => Promise<void>;
}
```

**Returns** `{ search: string; setSearch: Dispatch<SetStateAction<…>>; amountReceived: string; setAmountReceived: Dispatc …` &mdash; The filtered lists, the filter state and setters, the tab counts, the draft accessors, and every mutation the card needs.

Mounted once by the grocery-lists page. The card components are presentation
over the values this returns.

What it owns:

- **The orders**, refreshed on mount and then every
  `POLL_MS` milliseconds. A failed poll leaves the previous list on
  screen; no error is surfaced, so a server outage looks like a quiet shop.
- **Three filters**, applied in order: the status tab, then the amount
  matcher, then the text search. They compose, so a search can return nothing
  because an amount is still in the matcher box.
- **Price and rate drafts**, in memory only.
- **`savingListId`**, which the card uses to disable a list's controls while
  one of its mutations is in flight.

New-order alerting works off a ref holding the ids seen so far. The first
poll only seeds that set, so opening the page does not announce every order
already in it; from the second poll onwards, an unrecognised id triggers the
chime, the tab-title flash and a toast. Because the set lives in a ref, a
reload re-seeds and nothing is announced twice.

Mutations all follow one shape: set `savingListId`, await the call, replace
the whole array from the response, clear `savingListId`. None of them catches
its error — a rejection propagates to the caller, and the card is responsible
for the toast.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/use-admin-grocery-lists.ts#L129)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/use-admin-grocery-lists.ts)
