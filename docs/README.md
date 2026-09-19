# sKirana — documentation

A customer sends a grocery list to one shop; the shop prices it and sends it
back; the customer collects and pays. Three apps, one server, one database.

## Start here

| If you are… | Read |
|---|---|
| New to the project | [ARCHITECTURE.md](ARCHITECTURE.md) — what the pieces are and how a request travels |
| Fixing something in production, now | [ARCHITECTURE.md § 8](ARCHITECTURE.md#8-production-runbook) — symptoms and their known causes |
| Changing the database | [DATA-MODEL.md](DATA-MODEL.md) — every collection, field, index and invariant |
| Calling or changing an endpoint | [API.md](API.md) — all 76 endpoints with requests, responses, errors and side effects |
| Working on the customer app | [MOBILE-APP.md](MOBILE-APP.md) — screens, stores, components, release, traps |
| Working on the shop's panel | [ADMIN-WEB.md](ADMIN-WEB.md) — pages, routing, auth, what is live and what is dead |
| Setting up the domain, Clerk or keys | [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md) — the one-time runbook |

## The generated reference

The source itself carries TSDoc comments — roughly a thousand of them, on every
exported function, component, store, model and route handler. They document what
a caller cannot see from the signature: what a function throws, what it writes,
what it calls, what it caps, and why the odd-looking parts are odd.

To read them as a browsable site:

```bash
cd server   && npm run docs   # → docs/reference/server/index.html
cd mobile   && npm run docs   # → docs/reference/mobile/index.html
cd client   && npm run docs   # → docs/reference/admin/index.html
```

The output is **not committed** — it is a build product, and committing it would
put a thousand-line diff behind every comment change. Generate it when you want
it. (TypeDoc, not Doxygen: Doxygen is a C and C++ tool and understands
TypeScript's types poorly.)

The documents in this folder and the comments in the code do different jobs.
These explain the system; the comments explain the call in front of you. When
they disagree, the comments are closer to the code and usually right.

## How these were written

Every document was written by reading the code, not from memory, and each claim
names the file and the function it came from. Where the live database or a live
endpoint was checked, the measured value is stated. Anything that could not be
verified is marked **unverified** rather than guessed — trust those marks.

**References name a file and a symbol, never a line number.** They used to
carry line numbers, and a single pass of adding comments moved every one of
them: 1,383 citations became wrong in an afternoon without a word of prose
changing. A file path and a function name survive that; a line number cannot.

They record two kinds of thing that code alone does not:

- **Why** something strange is the way it is (keyboard maths on Android, the
  6-hour merge window, a hand-written sheet instead of a library).
- **What is already broken or dead**, with evidence — the inherited e-commerce
  cart and checkout, unpaginated list endpoints, and a handful of real bugs in
  code no shipped client reaches. Read the "known gaps" sections before
  assuming a piece of this codebase is load bearing.

## Keeping them true

Documentation that drifts is worse than none. Two habits are enough:

1. When you add a field, follow the checklist in
   [DATA-MODEL.md](DATA-MODEL.md) — model, route mapper, mobile types, admin
   types — and update the table there in the same commit.
2. When you add or change an endpoint, update its entry in [API.md](API.md) in
   the same commit. It is a reference, not a narrative; one section changes.

If something here contradicts the code, **the code is right** — fix the
document and say so in the commit message.
