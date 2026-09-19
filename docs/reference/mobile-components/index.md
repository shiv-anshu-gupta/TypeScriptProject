# Mobile app — components

The React Native components the screens are built from, from the button primitive up to the whole grocery-list sheet.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `mobile/src/components/` |
| Files | 27 |
| Exported symbols | 38 |
| Carrying a description | 33 of 38 symbols, 27 of 27 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/components/auth/AuthPanel.tsx`](components-auth-auth-panel.md) | AuthPanel | The login itself: Google, or an email and a six-digit code. | 1 |
| [`src/components/auth/AuthView.tsx`](components-auth-auth-view.md) | AuthView | The scrolling page that wraps the login panel. | 1 |
| [`src/components/BannerCarousel.tsx`](components-banner-carousel.md) | BannerCarousel | The promo strip at the top of the Home screen. | 1 |
| [`src/components/ChatSheet.tsx`](components-chat-sheet.md) | ChatSheet | The per-order conversation with the shop. | 1 |
| [`src/components/CurvedCaption.tsx`](components-curved-caption.md) | CurvedCaption | Curved text that stays correctly shaped in complex scripts like Devanagari. | 2 |
| [`src/components/CustomTabBar.tsx`](components-custom-tab-bar.md) | CustomTabBar | The bottom bar: four tabs and the raised button that opens the list. | 1 |
| [`src/components/GoogleAuthButton.tsx`](components-google-auth-button.md) | GoogleAuthButton | The "Continue with Google" button. | 1 |
| [`src/components/GroceryList.tsx`](components-grocery-list.md) | GroceryList | The draft list as an inline block, for the Lists tab. | 1 |
| [`src/components/GroceryListEditor.tsx`](components-grocery-list-editor.md) | GroceryListEditor | The ruled paper the customer writes their grocery list on. | 3 |
| [`src/components/GroceryListSheet.tsx`](components-grocery-list-sheet.md) | GroceryListSheet | The list paper as a near-full-screen bottom sheet. | 1 |
| [`src/components/ListProgressCard.tsx`](components-list-progress-card.md) | ListProgressCard | Home's lead card: where the customer is in the list journey. | 1 |
| [`src/components/PhonePrompt.tsx`](components-phone-prompt.md) | PhonePrompt | The one-time sheet asking for the customer's mobile number. | 1 |
| [`src/components/ProductCard.tsx`](components-product-card.md) | ProductCard | The product tile used in every grid in the app. | 2 |
| [`src/components/ProfileAvatar.tsx`](components-profile-avatar.md) | ProfileAvatar | The customer's avatar square. | 1 |
| [`src/components/ProfileEditSheet.tsx`](components-profile-edit-sheet.md) | ProfileEditSheet | The sheet for editing the name and number the shop sees. | 1 |
| [`src/components/QuantityControl.tsx`](components-quantity-control.md) | QuantityControl | The unit-aware quantity stepper. | 1 |
| [`src/components/QuantitySheet.tsx`](components-quantity-sheet.md) | QuantitySheet | The quantity picker sheet, and the single instance of it mounted at the app root. | 2 |
| [`src/components/ScanListPhoto.tsx`](components-scan-list-photo.md) | ScanListPhoto | The camera button that reads a handwritten list into the draft. | 1 |
| [`src/components/SearchBar.tsx`](components-search-bar.md) | SearchBar | The product search field, and the button that looks like it. | 2 |
| [`src/components/SendListButton.tsx`](components-send-list-button.md) | SendListButton | The Send control for the draft list, in its two shapes. | 1 |
| [`src/components/StoreUpdatePrompt.tsx`](components-store-update-prompt.md) | StoreUpdatePrompt | The prompt for a new Play Store build. | 1 |
| [`src/components/Toaster.tsx`](components-toaster.md) | Toaster | The host that draws queued toast messages. | 1 |
| [`src/components/ui/Badge.tsx`](components-ui-badge.md) | Badge | The small rounded label used for stock, status and category chips. | 1 |
| [`src/components/ui/Button.tsx`](components-ui-button.md) | Button | The app's one button: five variants, three sizes, a built-in busy state. | 1 |
| [`src/components/ui/Card.tsx`](components-ui-card.md) | Card | The bordered panel every grouped block of content sits in. | 1 |
| [`src/components/ui/Sheet.tsx`](components-ui-sheet.md) | Sheet | The app's single bottom sheet, its error boundary, and the re-exported pieces a sheet's insides are built from. | 6 |
| [`src/components/UpdatePrompt.tsx`](components-update-prompt.md) | UpdatePrompt | The prompt for an over-the-air JavaScript update. | 1 |

## Exported symbols

???+ info "All 38 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`AuthPanel`](components-auth-auth-panel.md#component-auth-panel) | React component | [`AuthPanel`](components-auth-auth-panel.md) | Two steps in one panel: a Google button and an email box, then six boxes for the code that arrives by email. |
    | [`AuthView`](components-auth-auth-view.md#component-auth-view) | React component | [`AuthView`](components-auth-auth-view.md) | The login as a full page, scrolled so the field being typed in is never under the keyboard. |
    | [`Badge`](components-ui-badge.md#component-badge) | React component | [`Badge`](components-ui-badge.md) | A pill-shaped label that sits beside content it describes, such as "In stock" on a product or a status word on an order card. |
    | [`BannerCarousel`](components-banner-carousel.md#component-banner-carousel) | React component | [`BannerCarousel`](components-banner-carousel.md) | A swipeable row of promo pictures with page dots, which advances itself every few seconds. |
    | [`Button`](components-ui-button.md#component-button) | React component | [`Button`](components-ui-button.md) | A tappable button with a label, an optional leading icon and a spinner while the action it starts is still running. |
    | [`Card`](components-ui-card.md#component-card) | React component | [`Card`](components-ui-card.md) | A rounded, bordered surface that groups related content — an order, a settings block, a product tile. |
    | [`ChatSheet`](components-chat-sheet.md#component-chat-sheet) | React component | [`ChatSheet`](components-chat-sheet.md) | A conversation with the shop about one order, opened from that order's card. |
    | [`CurvedCaption`](components-curved-caption.md#component-curved-caption) | React component | [`CurvedCaption`](components-curved-caption.md) | A short caption bent around a circle, used for the label under the tab bar's centre button. |
    | [`CustomTabBar`](components-custom-tab-bar.md#component-custom-tab-bar) | React component | [`CustomTabBar`](components-custom-tab-bar.md) | The bar along the bottom of every tab screen, cradling a large round button that opens the grocery list. |
    | [`GoogleAuthButton`](components-google-auth-button.md#component-google-auth-button) | React component | [`GoogleAuthButton`](components-google-auth-button.md) | Signs the customer in with their Google account, opening Google's own page in a browser window over the app. |
    | [`GroceryList`](components-grocery-list.md#component-grocery-list) | React component | [`GroceryList`](components-grocery-list.md) | The customer's unsent list shown inside a card, with the camera and Send beneath it and a note that the shop will send the price. |
    | [`GroceryListEditor`](components-grocery-list-editor.md#component-grocery-list-editor) | React component | [`GroceryListEditor`](components-grocery-list-editor.md) | The list the customer types into: numbered lines with an item and a quantity, shown as a page of cream paper. |
    | [`GroceryListSheet`](components-grocery-list-sheet.md#component-grocery-list-sheet) | React component | [`GroceryListSheet`](components-grocery-list-sheet.md) | The full page of paper the customer writes their list on, slid up over whatever screen they were on. |
    | [`ListProgressCard`](components-list-progress-card.md#component-list-progress-card) | React component | [`ListProgressCard`](components-list-progress-card.md) | The card at the top of Home telling the customer what to do next, with a four-step strip lit up to where they are. |
    | [`PAPER_HEADER_HEIGHT`](components-grocery-list-editor.md#constant-paper-header-height) | Constant | [`GroceryListEditor`](components-grocery-list-editor.md) | The height of the paper's column header, in points. |
    | [`PhonePrompt`](components-phone-prompt.md#component-phone-prompt) | React component | [`PhonePrompt`](components-phone-prompt.md) | A short sheet asking for a mobile number before the customer's first list goes to the shop. |
    | [`ProductCard`](components-product-card.md#component-product-card) | React component | [`ProductCard`](components-product-card.md) | One product in a grid: its photo, brand, name and pack size, with a heart to save it and a "+" to put it on the list. |
    | [`ProductCardData`](components-product-card.md#type-product-card-data) | Type | [`ProductCard`](components-product-card.md) | The fields a card needs. |
    | [`ProfileAvatar`](components-profile-avatar.md#component-profile-avatar) | React component | [`ProfileAvatar`](components-profile-avatar.md) | A rounded square in the brand colour showing the customer's first initial. |
    | [`ProfileEditSheet`](components-profile-edit-sheet.md#component-profile-edit-sheet) | React component | [`ProfileEditSheet`](components-profile-edit-sheet.md) | A short sheet with a name field and a mobile field, saving what the shop will see on this customer's orders. |
    | [`QuantityControl`](components-quantity-control.md#component-quantity-control) | React component | [`QuantityControl`](components-quantity-control.md) | A minus/plus stepper with preset chips, showing the customer the exact quantity the shop will be sent. |
    | [`QuantitySheet`](components-quantity-sheet.md#component-quantity-sheet) | React component | [`QuantitySheet`](components-quantity-sheet.md) | A short sheet asking how much of one product the customer wants, with the exact wording the shop will receive shown underneath. |
    | [`QuantitySheetHost`](components-quantity-sheet.md#component-quantity-sheet-host) | React component | [`QuantitySheet`](components-quantity-sheet.md) | The quantity picker the whole app shares, mounted once at the root. |
    | [`ROW_HEIGHT`](components-grocery-list-editor.md#constant-row-height) | Constant | [`GroceryListEditor`](components-grocery-list-editor.md) | The height of one written line, in points. |
    | [`ScanListPhoto`](components-scan-list-photo.md#component-scan-list-photo) | React component | [`ScanListPhoto`](components-scan-list-photo.md) | A camera button beside Send that offers Camera or Gallery, then writes what the photo says onto the list as ordinary editable lines. |
    | [`SearchBar`](components-search-bar.md#component-search-bar) | React component | [`SearchBar`](components-search-bar.md) | The box the customer types a product name into, with a clear button once there is something in it. |
    | [`SearchEntry`](components-search-bar.md#component-search-entry) | React component | [`SearchBar`](components-search-bar.md) | A search box on the Home screen that cannot be typed into — tapping it goes to the Shop tab with the real field focused. |
    | [`SendListButton`](components-send-list-button.md#component-send-list-button) | React component | [`SendListButton`](components-send-list-button.md) | The button that sends the customer's list to the shop, showing how many items are going and a spinner while it sends. |
    | [`Sheet`](components-ui-sheet.md#component-sheet) | React component | [`Sheet`](components-ui-sheet.md) | A panel that slides up from the bottom of the screen over whatever the customer was looking at, and can be pulled back down to dismiss. |
    | [`SheetFlatList`](components-ui-sheet.md#re-export-sheet-flat-list) | Re-export | [`Sheet`](components-ui-sheet.md) | — |
    | [`SheetFlatListRef`](components-ui-sheet.md#re-export-sheet-flat-list-ref) | Re-export | [`Sheet`](components-ui-sheet.md) | — |
    | [`SheetScrollView`](components-ui-sheet.md#re-export-sheet-scroll-view) | Re-export | [`Sheet`](components-ui-sheet.md) | — |
    | [`SheetScrollViewRef`](components-ui-sheet.md#re-export-sheet-scroll-view-ref) | Re-export | [`Sheet`](components-ui-sheet.md) | — |
    | [`SheetTextInput`](components-ui-sheet.md#re-export-sheet-text-input) | Re-export | [`Sheet`](components-ui-sheet.md) | — |
    | [`splitClusters`](components-curved-caption.md#function-split-clusters) | Function | [`CurvedCaption`](components-curved-caption.md) | Splits text into aksharas — syllable clusters that must stay whole. |
    | [`StoreUpdatePrompt`](components-store-update-prompt.md#component-store-update-prompt) | React component | [`StoreUpdatePrompt`](components-store-update-prompt.md) | A dialog asking the customer to install a newer build from the Play Store, without a way out when their version is below the supported floor. |
    | [`Toaster`](components-toaster.md#component-toaster) | React component | [`Toaster`](components-toaster.md) | Brief messages stacked under the status bar — what was saved, what failed, what the shop just did. |
    | [`UpdatePrompt`](components-update-prompt.md#component-update-prompt) | React component | [`UpdatePrompt`](components-update-prompt.md) | A dialog offering to restart the app into a newly downloaded update, with a "Later" the customer can always take. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
