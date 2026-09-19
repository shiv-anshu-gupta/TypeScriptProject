# Server — services

Work that is neither a route nor a model: talking to a third party and turning the answer into our own shapes.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `server/src/services/` |
| Files | 2 |
| Exported symbols | 5 |
| Carrying a description | 5 of 5 symbols, 2 of 2 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/services/photo-list-parser.ts`](services-photo-list-parser.md) | Photo list parser | Reads a photo of a handwritten grocery list and returns the items as text. | 4 |
| [`src/services/user-sync.ts`](services-user-sync.md) | syncDbUser | Keeps the app's own user record in step with Clerk. | 1 |

## Exported symbols

???+ info "All 5 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`ParsedPhotoItem`](services-photo-list-parser.md#type-parsed-photo-item) | Type | [`photo-list-parser`](services-photo-list-parser.md) | One item read off the paper. |
    | [`ParsedPhotoList`](services-photo-list-parser.md#type-parsed-photo-list) | Type | [`photo-list-parser`](services-photo-list-parser.md) | The result of reading one customer's photographs. |
    | [`parseGroceryListPhotos`](services-photo-list-parser.md#function-parse-grocery-list-photos) | Function | [`photo-list-parser`](services-photo-list-parser.md) | Reads one customer's photographed list and returns the items as text. |
    | [`PhotoToRead`](services-photo-list-parser.md#type-photo-to-read) | Type | [`photo-list-parser`](services-photo-list-parser.md) | The photo as it came off the phone. |
    | [`syncDbUser`](services-user-sync.md#function-sync-db-user) | Function | [`user-sync`](services-user-sync.md) | Returns the user record for a Clerk user, creating it - or re-linking an earlier record with the same verified email - when there isn't one yet. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
