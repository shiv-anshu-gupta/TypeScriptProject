# toast

The app's transient messages: a tiny store the `Toaster` renders, plus a `toast` object callable from anywhere.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/toast.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 4 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`toast`](#constant-toast) | Constant | `const toast: { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void }` | Shows a message from anywhere, React or not. |
| [`ToastItem`](#type-toast-item) | Type | `type ToastItem = { … };` | One message currently on screen. |
| [`ToastVariant`](#type-toast-variant) | Type | `type ToastVariant = "success" \| "error" \| "info";` | Which of the three pill styles a message is drawn in. |
| [`useToastStore`](#hook-use-toast-store) | Hook | `const useToastStore: UseBoundStore<StoreApi<ToastStore>>` | Holds the messages currently on screen. |

## Exports in detail

### `toast` {#constant-toast}

*Constant*

Shows a message from anywhere, React or not.

```ts
const toast: { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void }
```

Drop-in replacement for sonner's `toast` API used across the ported stores.

It reaches the store through `getState()`, so stores, api callers and
plain functions can all use it without a hook. The message is shown
verbatim — callers translate first, usually through the default `i18n.t`
import rather than `useTranslation`.

**Example**

```ts
toast.success(i18n.t("lists.sentToShop"));
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/toast.ts#L86)

### `ToastItem` {#type-toast-item}

*Type*

One message currently on screen.

```ts
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};
```

| Property | Type | Meaning |
|---|---|---|
| `id` | `number` | — |
| `message` | `string` | — |
| `variant` | `ToastVariant` | — |

`id` comes from a module counter, not from the message, so the same text
shown twice is two entries and each dismisses on its own timer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/toast.ts#L25)

### `ToastVariant` {#type-toast-variant}

*Type*

Which of the three pill styles a message is drawn in.

```ts
type ToastVariant = "success" | "error" | "info";
```

Purely cosmetic: all three behave the same and dismiss on the same timer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/toast.ts#L16)

### `useToastStore` {#hook-use-toast-store}

*Hook*

Holds the messages currently on screen.

```ts
const useToastStore: UseBoundStore<StoreApi<ToastStore>>
```

Written only by the [`toast`](#constant-toast) helpers and by the `Toaster`, which calls
`dismiss` when a pill is swiped away. Nothing is persisted; a restart
starts with no messages, which is correct — a message is about something
that just happened.

`push` schedules its own removal 2500 ms later, so a caller never has to
dismiss. The timer is not cancelled by an early `dismiss`; it simply finds
nothing to remove.

Read by exactly one component. The `Toaster` is mounted outside the portal
host, above every sheet, so a message the customer must read is never drawn
behind one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/toast.ts#L56)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/toast.ts)
