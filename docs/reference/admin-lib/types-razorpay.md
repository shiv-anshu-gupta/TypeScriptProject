# Razorpay `razorpay`

*No module description in the source.*

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/types/razorpay.d.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`RazorpayOptions`](#interface-razorpay-options) | Interface | `interface RazorpayOptions { … }` | — |
| [`RazorpaySuccessResponse`](#interface-razorpay-success-response) | Interface | `interface RazorpaySuccessResponse { … }` | — |
| [`Window`](#interface-window) | Interface | `interface Window { … }` | The **`Window`** interface represents a window containing a DOM document; the `document` property points to the DOM document loaded in that window. |

## Exports in detail

### `RazorpayOptions` {#interface-razorpay-options}

*Interface*

```ts
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}
```

| Property | Type | Meaning |
|---|---|---|
| `amount` | `number` | — |
| `currency` | `string` | — |
| `description?` | `string` | — |
| `handler` | `(response: RazorpaySuccessResponse) => void \| Promise<…>` | — |
| `key` | `string` | — |
| `modal?` | `{ ondismiss?: () => void }` | — |
| `name` | `string` | — |
| `order_id` | `string` | — |
| `prefill?` | `{ name?: string; email?: string; contact?: string }` | — |
| `theme?` | `{ color?: string }` | — |

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/types/razorpay.d.ts#L10)

### `RazorpaySuccessResponse` {#interface-razorpay-success-response}

*Interface*

```ts
interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
```

| Property | Type | Meaning |
|---|---|---|
| `razorpay_order_id` | `string` | — |
| `razorpay_payment_id` | `string` | — |
| `razorpay_signature` | `string` | — |

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/types/razorpay.d.ts#L4)

### `Window` {#interface-window}

*Interface · augments the declaration in `typescript`*

The **`Window`** interface represents a window containing a DOM document; the `document` property points to the DOM document loaded in that window.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window)

```ts
interface Window {
  Razorpay?: (options: RazorpayOptions) => { open: () => void };
}
```

Only the members declared in this file are listed.

| Property | Type | Meaning |
|---|---|---|
| `Razorpay?` | `(options: RazorpayOptions) => { … }` | — |

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/types/razorpay.d.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/types/razorpay.d.ts)
