# clerkAppearance `clerk-appearance`

The sKirana theme applied to every Clerk screen.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/clerk-appearance.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`clerkAppearance`](#constant-clerk-appearance) | Constant | `const clerkAppearance: { variables: { colorPrimary: string; colorPrimaryForeground: string; colorForeground: string; colorMutedForeground: string; colorBackground: string; colorInput: string; colorInputForeground: string; colorBorder: string; colorRing: string; colorDanger: string; fontFamily: string; borderRadius: string }; options: { logoImageUrl: string; logoLinkUrl: string; logoPlacement: string; socialButtonsVariant: string; socialButtonsPlacement: string; privacyPageUrl: string; termsPageUrl: string }; elements: { cardBox: string; logoImage: string; socialButtonsBlockButtonText: string; socialButtonsBlockButton: string; formFieldInput: string } }` | Appearance object passed to `ClerkProvider` in `main.tsx`. |

## Exports in detail

### `clerkAppearance` {#constant-clerk-appearance}

*Constant*

Appearance object passed to `ClerkProvider` in `main.tsx`.

```ts
const clerkAppearance: { variables: { colorPrimary: string; colorPrimaryForeground: string; colorForeground: string; colorMutedForeground: string; colorBackground: string; colorInput: string; colorInputForeground: string; colorBorder: string; colorRing: string; colorDanger: string; fontFamily: string; borderRadius: string }; options: { logoImageUrl: string; logoLinkUrl: string; logoPlacement: string; socialButtonsVariant: string; socialButtonsPlacement: string; privacyPageUrl: string; termsPageUrl: string }; elements: { cardBox: string; logoImage: string; socialButtonsBlockButtonText: string; socialButtonsBlockButton: string; formFieldInput: string } }
```

It styles the sign-in and sign-up forms and the `UserButton` account menu in
the admin header. Keeping it in code, rather than in the Clerk dashboard,
means the development and production Clerk instances cannot drift apart.

Three details that are easy to undo by accident, each recorded in the inline
comments below and worth preserving:

- Clerk's current API puts layout settings under `options`, not `layout`, and
  renamed several colour variables. Older examples found online will not
  apply cleanly.
- The admin theme sets `--radius` to 0, so Tailwind's `rounded-*` utilities
  are square here. Every radius in `elements` is an explicit pixel value for
  that reason.
- Two `elements` overrides exist to fix real visibility problems: the social
  button label was white on white, and Clerk's default hairline borders were
  nearly invisible on the cream background.

`privacyPageUrl` and `termsPageUrl` point at this app's own public legal
routes, which is part of why those routes must stay unguarded.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/clerk-appearance.ts#L37)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/clerk-appearance.ts)
