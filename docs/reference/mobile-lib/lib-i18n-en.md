# en

The English half of the app's strings, and the key list every other language is checked against.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/i18n/en.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 2 |

## Description

Keys are `namespace.key`, exactly two levels deep, with one exception:
`lists.timeline.*` and `lists.tabs.*` go three deep because they are looked
up dynamically by a list's status.

Countable things use i18next v4 plurals — `_one` and `_other` suffixes on
the same base key, always with an interpolated `{{count}}`, and always
called as `t("key", { count })`. Hindi has the same two categories, so the
two suffixes suffice there too.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`en`](#constant-en) | Constant | `const en: { common: { clearSearch: string; somethingWrong: string; save: string; cancel: string; close: string; delete: string; remove: string; later: string; updateNow: string; language: string }; tabs: { writeList: string; home: string; shop: string; lists: string; account: string }; journey: { sendTitle: string; sendSub_one: string; sendSub_other: string; pricingTitle: string; pricingSub: string; pricedTitle: string; pricedSub: string; packingSub: string; readyTitle: string; readySub: string; moreActive_one: string; moreActive_other: string }; home: { myList: string; itemCount_one: string; itemCount_other: string; noLimit: string; writeHint: string; send: string; removeItem: string; searchHint: string; listTitle: string; listSubtitle: string; step1: string; step2: string; step3: string; step4: string; itemExample: string; qtyExample: string; writeAtLeastOne: string; nameTooShort: string; signInToSend: string; tagline: string; browse: string; newArrivals: string; viewAll: string; item: string; qty: string; sendList: string; sendItems_one: string; sendItems_other: string; priceNote: string }; phone: { send: string; title: string; placeholder: string; invalid: string; trust: string; save: string }; photos: { add: string; addTitle: string; camera: string; gallery: string; reading: string; added_one: string; added_other: string; allAlreadyThere: string; notReadable: string; readFailed: string; cameraDenied: string; openSettings: string; settings: string }; lists: { sentToShop: string; mergedIntoList: string; sendFailed: string; itemRemoved: string; payAtShopSet: string; payFailed: string; noUpiSetUp: string; notPricedYet: string; noUpiApp: string; title: string; listNo: string; itemsCount_one: string; itemsCount_other: string; newUpdate: string; waiting: string; busy: string; total: string; estimate: string; paymentReceived: string; payUpi: string; payAtShop: string; payNote: string; messageShop: string; notAvailable: string; removeTitle: string; removeConfirm: string; cancelled: string; emptySignedOut: string; emptyNoLists: string; goHome: string; newListLabel: string; notSent: string; tabs: { … }; emptyTab: string; timeline: { … } }; shop: { title: string; newest: string; searchPlaceholder: string; resultCount_one: string; resultCount_other: string; clear: string; all: string; noProducts: string; inList_one: string; inList_other: string; viewSend: string; soldPer: string; perPack: string; howMuch: string; addToList: string }; product: { shopWillReceive: string; saveFailed: string; save: string; saved: string; removed: string; signInToSave: string; wishlistFailed: string; notLoaded: string; onlyLeft: string; inStock: string; outOfStock: string; soldPerNote: string; quantity: string; color: string; size: string; related: string; addToList: string; added: string }; auth: { title: string; subtitle: string; continueGoogle: string; or: string; emailLabel: string; emailPlaceholder: string; emailInvalid: string; continue: string; consentPrefix: string; consentSuffix: string; privacyTerms: string; codeTitle: string; codeSentTo: string; changeEmail: string; checkSpam: string; newAccount: string; nameLabel: string; namePlaceholder: string; verifyContinue: string; resend: string; resendIn: string; codeWrong: string; codeExpired: string; codeDead: string; tooMany: string; setupIncomplete: string; accountOnHold: string; tryAgain: string; googleFailed: string }; chat: { aboutOrder: string; empty: string; placeholder: string; sendFailed: string }; wishlist: { removed: string; signedOut: string; empty: string }; account: { editProfile: string; editTitle: string; namePlaceholder: string; nameRequired: string; profileSaved: string; myDetails: string; mobile: string; email: string; notAdded: string; totalOrders: string; thisMonth: string; memberSince: string; monthsValue_one: string; monthsValue_other: string; daysValue_one: string; daysValue_other: string; notifications: string; notificationsSub: string; help: string; helpSub: string; rate: string; rateSub: string; terms: string; savedProductsSub: string; settings: string; privacyTerms: string; savedProducts: string; customer: string; addresses: string; add: string; fullName: string; address: string; state: string; postalCode: string; setDefault: string; noAddresses: string; default: string; edit: string; signOut: string }; update: { title: string; body: string }; storeUpdate: { title: string; body: string; forced: string; cta: string } }` | Every string the app can show, in English. |
| [`Translations`](#type-translations) | Type | `type Translations = typeof en;` | The shape every other language must have. |

## Exports in detail

### `en` {#constant-en}

*Constant*

Every string the app can show, in English.

```ts
const en: { common: { clearSearch: string; somethingWrong: string; save: string; cancel: string; close: string; delete: string; remove: string; later: string; updateNow: string; language: string }; tabs: { writeList: string; home: string; shop: string; lists: string; account: string }; journey: { sendTitle: string; sendSub_one: string; sendSub_other: string; pricingTitle: string; pricingSub: string; pricedTitle: string; pricedSub: string; packingSub: string; readyTitle: string; readySub: string; moreActive_one: string; moreActive_other: string }; home: { myList: string; itemCount_one: string; itemCount_other: string; noLimit: string; writeHint: string; send: string; removeItem: string; searchHint: string; listTitle: string; listSubtitle: string; step1: string; step2: string; step3: string; step4: string; itemExample: string; qtyExample: string; writeAtLeastOne: string; nameTooShort: string; signInToSend: string; tagline: string; browse: string; newArrivals: string; viewAll: string; item: string; qty: string; sendList: string; sendItems_one: string; sendItems_other: string; priceNote: string }; phone: { send: string; title: string; placeholder: string; invalid: string; trust: string; save: string }; photos: { add: string; addTitle: string; camera: string; gallery: string; reading: string; added_one: string; added_other: string; allAlreadyThere: string; notReadable: string; readFailed: string; cameraDenied: string; openSettings: string; settings: string }; lists: { sentToShop: string; mergedIntoList: string; sendFailed: string; itemRemoved: string; payAtShopSet: string; payFailed: string; noUpiSetUp: string; notPricedYet: string; noUpiApp: string; title: string; listNo: string; itemsCount_one: string; itemsCount_other: string; newUpdate: string; waiting: string; busy: string; total: string; estimate: string; paymentReceived: string; payUpi: string; payAtShop: string; payNote: string; messageShop: string; notAvailable: string; removeTitle: string; removeConfirm: string; cancelled: string; emptySignedOut: string; emptyNoLists: string; goHome: string; newListLabel: string; notSent: string; tabs: { … }; emptyTab: string; timeline: { … } }; shop: { title: string; newest: string; searchPlaceholder: string; resultCount_one: string; resultCount_other: string; clear: string; all: string; noProducts: string; inList_one: string; inList_other: string; viewSend: string; soldPer: string; perPack: string; howMuch: string; addToList: string }; product: { shopWillReceive: string; saveFailed: string; save: string; saved: string; removed: string; signInToSave: string; wishlistFailed: string; notLoaded: string; onlyLeft: string; inStock: string; outOfStock: string; soldPerNote: string; quantity: string; color: string; size: string; related: string; addToList: string; added: string }; auth: { title: string; subtitle: string; continueGoogle: string; or: string; emailLabel: string; emailPlaceholder: string; emailInvalid: string; continue: string; consentPrefix: string; consentSuffix: string; privacyTerms: string; codeTitle: string; codeSentTo: string; changeEmail: string; checkSpam: string; newAccount: string; nameLabel: string; namePlaceholder: string; verifyContinue: string; resend: string; resendIn: string; codeWrong: string; codeExpired: string; codeDead: string; tooMany: string; setupIncomplete: string; accountOnHold: string; tryAgain: string; googleFailed: string }; chat: { aboutOrder: string; empty: string; placeholder: string; sendFailed: string }; wishlist: { removed: string; signedOut: string; empty: string }; account: { editProfile: string; editTitle: string; namePlaceholder: string; nameRequired: string; profileSaved: string; myDetails: string; mobile: string; email: string; notAdded: string; totalOrders: string; thisMonth: string; memberSince: string; monthsValue_one: string; monthsValue_other: string; daysValue_one: string; daysValue_other: string; notifications: string; notificationsSub: string; help: string; helpSub: string; rate: string; rateSub: string; terms: string; savedProductsSub: string; settings: string; privacyTerms: string; savedProducts: string; customer: string; addresses: string; add: string; fullName: string; address: string; state: string; postalCode: string; setDefault: string; noAddresses: string; default: string; edit: string; signOut: string }; update: { title: string; body: string }; storeUpdate: { title: string; body: string; forced: string; cta: string } }
```

English strings. Keep keys in sync with hi.ts.

Adding a string means adding it here **and** to `hi.ts`, then running
`npx tsc --noEmit` — that is the only check there is.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/en.ts#L27)

### `Translations` {#type-translations}

*Type*

The shape every other language must have.

```ts
type Translations = typeof en;
```

Derived from the English object, which is what makes a missing or stray key
in `hi.ts` a compile error rather than a string that silently falls back.
It types the values too, so a key whose English value is a string cannot
become a nested object in another language.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/en.ts#L313)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/en.ts)
