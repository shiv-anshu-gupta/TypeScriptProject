# Sheet

The app's single bottom sheet, its error boundary, and the re-exported pieces a sheet's insides are built from.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ui/Sheet.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 6 |

## Description

The ONE sheet in the app: everything that slides up from the bottom - the
list paper, the phone prompt, chat, the quantity picker, editing a profile -
is this component with different children. One place decides how a sheet
looks, how it closes, and how it behaves with the keyboard, so they can
never drift apart.

The point of it is the thing a plain `<Modal>` cannot do: PULL IT DOWN to
close. Before this, a customer had to find the small ✕ or tap the strip of
screen above the sheet. The drag runs on the UI thread (gesture-handler +
reanimated), so the sheet follows the finger instead of lagging behind it.

Why this is hand-written rather than `@gorhom/bottom-sheet`: that library is
written for Reanimated 3, and on Reanimated 4 - which Expo SDK 54 requires -
its sheets simply never open. We tried it; they didn't. Do not "simplify"
this file by reaching for the library.

Sheets are drawn through a portal at the app root, so one can sit on top of
another (Send inside the list sheet opens the phone prompt) - a `<Modal>`
inside a `<Modal>` was unreliable on Android, which is what forced each
screen to hand-roll its own sheet before.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Sheet`](#component-sheet) | React component | `function Sheet(props: SheetProps): Element \| null` | A panel that slides up from the bottom of the screen over whatever the customer was looking at, and can be pulled back down to dismiss. |
| [`SheetFlatList`](#re-export-sheet-flat-list) | Re-export | `export { SheetFlatList }; // declared in react-native` | — |
| [`SheetFlatListRef`](#re-export-sheet-flat-list-ref) | Re-export | `export { SheetFlatListRef };` | — |
| [`SheetScrollView`](#re-export-sheet-scroll-view) | Re-export | `export { SheetScrollView }; // declared in react-native` | — |
| [`SheetScrollViewRef`](#re-export-sheet-scroll-view-ref) | Re-export | `export { SheetScrollViewRef };` | — |
| [`SheetTextInput`](#re-export-sheet-text-input) | Re-export | `export { SheetTextInput }; // declared in react-native` | — |

## Exports in detail

### `Sheet` {#component-sheet}

*React component*

A panel that slides up from the bottom of the screen over whatever the
customer was looking at, and can be pulled back down to dismiss.

```ts
function Sheet(props: SheetProps): Element | null
```

| Prop | Type | Meaning |
|---|---|---|
| `bare?` | `boolean` | Removes the side padding and the bottom inset, for content that owns its own edges. |
| `bottomPadding?` | `number` | Added on top of the phone's bottom inset. Ignored when `bare`. |
| `children` | `ReactNode` | — |
| `height?` | ``${number}%`` | A fixed height as a share of the screen. Changes the layout, not just the size: a tall sheet is pinned top and bottom and only its grab bar drags, while a short sheet hugs its content and drags anywhere. |
| `onClose` | `() => void` | — |
| `open` | `boolean` | — |

**Returns** `Element \| null`

Renders into `<Portal>`, whose host is mounted at the app root inside
`NavigationContainer`. That placement is deliberate twice over: it lets one
sheet open on top of another, and it lets sheet contents call
`useNavigation()` — which they do, since a sheet's insides are ordinary
screen code.

It stays mounted through the closing slide, so it leaves the screen instead
of vanishing. While closed it renders nothing, but it is not free: it still
measures the window, reads the safe area and creates shared values. Never
put a `<Sheet>` inside a list cell — open a shared one from a store instead.

Also owned here: Android's hardware back closes the top sheet; the backdrop
fades with the drag; the bottom edge rides on the keyboard; and content that
throws is caught by `SheetContentGuard` rather than blacking out the
app.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx#L116)

### `SheetFlatList` {#re-export-sheet-flat-list}

*Re-export · re-exported from `react-native`*

```ts
export { SheetFlatList }; // declared in react-native
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx)

### `SheetFlatListRef` {#re-export-sheet-flat-list-ref}

*Re-export*

```ts
export { SheetFlatListRef };
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx#L404)

### `SheetScrollView` {#re-export-sheet-scroll-view}

*Re-export · re-exported from `react-native`*

```ts
export { SheetScrollView }; // declared in react-native
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx)

### `SheetScrollViewRef` {#re-export-sheet-scroll-view-ref}

*Re-export*

```ts
export { SheetScrollViewRef };
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx#L405)

### `SheetTextInput` {#re-export-sheet-text-input}

*Re-export · re-exported from `react-native`*

```ts
export { SheetTextInput }; // declared in react-native
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Sheet.tsx)
