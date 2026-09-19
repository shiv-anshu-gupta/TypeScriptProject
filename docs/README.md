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

## How these were written

Every document was written by reading the code, not from memory, and each claim
carries the `file:line` it came from. Where the live database or a live endpoint
was checked, the measured value is stated. Anything that could not be verified
is marked **unverified** rather than guessed — trust those marks.

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
