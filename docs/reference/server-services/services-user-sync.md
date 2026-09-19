# syncDbUser `user-sync`

Keeps the app's own user record in step with Clerk.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/services/user-sync.ts` |
| Group | [Server — services](index.md) |
| Exports | 1 |

## Description

A person is identified by their Clerk user id, but that id is per Clerk
INSTANCE: when the app moved from Clerk's test instance to production,
every returning customer got a new id with the same email. The users
collection has a unique index on email, so creating a second record failed
and the customer ended up with no record at all ("User is not found in the
DB"). A verified email that already has a record is therefore re-linked to
the new id - keeping the customer's lists, phone number and role.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`syncDbUser`](#function-sync-db-user) | Function | `function syncDbUser(clerkUserId: string): Promise<any>` | Returns the user record for a Clerk user, creating it - or re-linking an earlier record with the same verified email - when there isn't one yet. |

## Exports in detail

### `syncDbUser` {#function-sync-db-user}

*Function*

Returns the user record for a Clerk user, creating it - or re-linking an
earlier record with the same verified email - when there isn't one yet.
Safe to call repeatedly and concurrently.

```ts
function syncDbUser(clerkUserId: string): Promise<any>
```

| Parameter | Type | Meaning |
|---|---|---|
| `clerkUserId` | `string` | — |

**Returns** `Promise<any>` &mdash; The Mongoose user document.

**Throws**

- `AppError` 409 when the email already belongs to another record that could not be re-linked because it is not verified on this account. Clerk API and other database errors propagate unchanged.

Calls Clerk's API every time, then takes one of three paths, numbered in
the body:

1. the id is already known - refresh the email, fill in a missing name, and
   grant admin if the email is in `ADMIN_EMAILS`;
2. no record for this id, but one exists with the same VERIFIED email - it
   is the same person after a Clerk instance change, so the record is moved
   onto the new id, keeping their lists, phone number and role. Only a
   verified email may claim a record;
3. otherwise create a new one.

WRITES in every path except an unchanged case 1. A re-link is logged with
both ids.

Concurrency-safe by retry, not by locking: two requests from the same login
can both reach case 3, and the loser catches the duplicate-key error and
returns the record the winner created.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/user-sync.ts#L125)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/user-sync.ts)
