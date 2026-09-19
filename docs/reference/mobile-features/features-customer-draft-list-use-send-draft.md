# useSendDraft `use-send-draft`

Sending the draft list to the shop.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/draft-list/use-send-draft.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useSendDraft`](#hook-use-send-draft) | Hook | `function useSendDraft(): { … }` | The one send flow, and the state the Send button needs to draw itself. |

## Exports in detail

### `useSendDraft` {#hook-use-send-draft}

*Hook*

The one send flow, and the state the Send button needs to draw itself.

```ts
function useSendDraft(): {
  filledRows: DraftRow[];
  submitting: boolean;
  send: () => Promise<void>;
  phonePromptOpen: boolean;
  closePhonePrompt: () => void;
  submitWithPhone: (phone: string) => Promise<boolean>;
}
```

**Returns** `{ filledRows: DraftRow[]; submitting: boolean; send: () => Promise<…>; phonePromptOpen: boolean; closePhoneP …` &mdash; `filledRows` (what would be sent), `submitting`, `send`, and the three pieces the caller needs to own the phone prompt: `phonePromptOpen`, `closePhonePrompt` and `submitWithPhone`.

Used by both shapes of the Send button — the pill in the list sheet's
header and the block button on the Lists tab — so validation, sign-in,
phone capture, submitting and clearing can never fork between them.

`send()` walks the same path every time:

1. At least one line with a name, or a toast and stop.
2. Every name at least `MIN_NAME_LEN` characters, or a toast naming
   the offending line and stop.
3. Signed in, or: toast, dismiss the keyboard, **close the sheet**, and
   navigate to the login. The sheet is closed first because on Android it
   is drawn over the whole app and the login would open behind it.
4. A mobile number on file, fetching the lists once to find out if it is
   not yet known. With none, the phone prompt opens and the submit happens
   later through `submitWithPhone`.
5. Submit; on success clear the draft, close the sheet and go to the Lists
   tab.

Only text is ever sent. A photo the customer took was read into these same
lines earlier and discarded there.

Re-entry is guarded by a ref rather than by the store's `submitting`, which
covers only the POST: `send()` can await a list fetch before that, and a
second tap in the gap would send the whole list twice. `submitting` is
still returned, because that is the right thing to put a spinner on.

Nothing here throws. Every failure ends in a toast and a `false`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/use-send-draft.ts#L75)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/use-send-draft.ts)
