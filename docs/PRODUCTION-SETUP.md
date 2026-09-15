# sKirana production setup

What we set up (13-15 Sept 2026) to move login from Clerk's test mode to
production on `skirana.com`. No secret values are written here.

## Where things live

| Service | What it holds |
|---|---|
| Cloudflare | Domain `skirana.com` (registrar, auto-renew ON) and all DNS records |
| Clerk | App "sKirana": **Development** (testers on 1.0.1) and **Production** (`clerk.skirana.com`) |
| Google Cloud | Project "skirana": Google login screen (branding) + OAuth client used by Clerk |
| Google Search Console | Proof that `skirana.com` is yours (must be the same Google account as Google Cloud) |
| Vercel | `type-script-project-jtdk` = server API · `type-script-project-eight` = homepage + admin on `www.skirana.com` |
| Expo (EAS) | Project "mobile": builds (.aab) and OTA updates on branch `production` |
| Play Console | `com.skirana.app`: closed testing, then production |

## The setup, in order

### Domain & website
1. Bought `skirana.com` on Cloudflare Registrar (~$10.5/yr, same price every renewal). Auto-renew + WHOIS privacy ON.
2. Vercel → `type-script-project-eight` → Settings → Domains → added `skirana.com` and `www.skirana.com`.
3. Homepage at `/` (`client/index.html`), admin at `/admin` (`client/app.html`), public `/privacy`, `/terms`, `/delete-account`.
4. Vercel → `type-script-project-jtdk` → `CORS_ORIGINS` += `https://www.skirana.com,https://skirana.com` → Redeploy.

### Clerk production (dashboard.clerk.com)
5. Top switch **Development** → Create production instance → **Clone development instance** → domain `skirana.com`.
6. Configure → Developers → Domains → skirana.com → **Configure automatically** (Cloudflare) → Authorize → **Verify configuration** (SSL issues itself).
7. Configure → Native applications → Android: package `com.skirana.app` (SHA-256 empty, only needed for passkeys). Allowlist for mobile SSO redirect: `skirana:///` (three slashes). Keep the default `clerk://com.skirana.app.callback`.
8. Application → Settings: logo, favicon, support email. (Admin sign-in is also themed in code: `client/src/lib/clerk-appearance.ts`.)
9. Configure → **Organizations** → turn Organizations **OFF** (sKirana doesn't use them). With "membership required" on, Clerk holds every login as a *pending* session: the app stays on the login screen and retries fail with "session already exists". Dev had it off; production had it on.
10. API keys: publishable key `pk_live_Y2xlcmsuc2tpcmFuYS5jb20k` (public). Secret key `sk_live_…` goes only into Vercel.

### Google login
11. console.cloud.google.com → new project "skirana" → Google Auth Platform → **Branding**: name sKirana, logo, home page `https://www.skirana.com`, privacy `/privacy`, terms `/terms`, authorized domain `skirana.com`.
12. **Audience** → External → **Publish app** (status "In production"). In "Testing" only listed test users can log in.
13. **Clients** → Create client → **Web application** "sKirana Clerk" → redirect URI `https://clerk.skirana.com/v1/oauth_callback` → copy Client ID + secret into Clerk → SSO connections → Google → **Use custom credentials**.
14. Search Console → Add property → **Domain** → `skirana.com` → Start verification (Cloudflare) → Authorize (adds the `google-site-verification` TXT record).
15. Google Cloud → Branding → **Publish / verify branding**. Until approved, Google shows "continue to clerk.skirana.com" instead of "sKirana".

### Switch keys & ship
16. `mobile/.env` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` = pk_live, and `app.json` version → 1.0.2 **in the same commit**.
17. EAS production build 1.0.2 (versionCode 17) → .aab uploaded to Play Console closed testing.
18. Vercel env values below → **Redeploy both projects**.

## Keys by place

| Place | Variable | Value |
|---|---|---|
| `mobile/.env` (in git) | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuc2tpcmFuYS5jb20k` |
| Vercel server | `CLERK_SECRET_KEY` | `sk_live_…` (secret, from Clerk → API keys) |
| Vercel server | `CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuc2tpcmFuYS5jb20k` |
| Vercel server | `APP_LATEST_VERSION` | `1.0.2` |
| Vercel server | `CORS_ORIGINS` | old value + `https://www.skirana.com,https://skirana.com` |
| Vercel server | `ADMIN_EMAILS` | emails that get admin rights on sign-up |
| Vercel admin | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuc2tpcmFuYS5jb20k` |
| Your PC only | `client/.env`, `server/.env`, `mobile/.env.local` | keep `pk_test` / `sk_test` (live keys don't work on localhost) |

**Never** paste `sk_live_…` into chat or a screenshot. If it leaks: Clerk → API keys → Add new key → Vercel → Redeploy → delete the old key.

## DNS records on Cloudflare

All Clerk records are **DNS only (grey cloud)**. Orange/proxied breaks login.

| Type | Name | Points to | Added by |
|---|---|---|---|
| CNAME | `clerk` | `frontend-api.clerk.services` | Clerk |
| CNAME | `accounts` | `accounts.clerk.services` | Clerk |
| CNAME | `clkmail` | `mail.1yckdxuwg9vw.clerk.services` | Clerk |
| CNAME | `clk._domainkey` | `dkim1.1yckdxuwg9vw.clerk.services` | Clerk |
| CNAME | `clk2._domainkey` | `dkim2.1yckdxuwg9vw.clerk.services` | Clerk |
| TXT | `@` | `google-site-verification=…` | Search Console |
| CNAME / A | `www`, `@` | Vercel's website records | Vercel |

## Lessons

- Clerk production needs your own domain; `*.vercel.app` doesn't work.
- Users don't move between Clerk instances: everyone signs up again. Admin rights come back via `ADMIN_EMAILS`.
- Vercel values apply only after **Redeploy**; `VITE_` values are baked into the admin build.
- Changing the app's Clerk key → bump the app version in the same commit (OTA only reaches the same version).
- Publish OTA updates with `npm run ota -- --message "..."` (from `mobile/`). It adds `--clear-cache`: Metro's cache kept the old `pk_test` key inlined after `.env` changed, and one OTA shipped it to 1.0.2 (Google then said "continue to Clerk").
- Switch app, admin and server keys **together**; mismatched keys = login fails.
- Cloning an instance doesn't guarantee identical settings: compare `/v1/environment` of both (e.g. `organization_settings.force_organization_selection`).
- Google Cloud console "Failed to load" → incognito window with one Google account.
- Expo `Linking.createURL("/")` = `skirana:///` in production; it must be in Clerk's allowlist.

## Still to do

- [ ] Clerk production → User & authentication → **Password OFF** (needed for email-code sign-up)
- [ ] Replace the secret key that appeared in a screenshot
- [ ] Confirm Vercel values saved + both projects redeployed
- [ ] Clerk production → Organizations **OFF** (step 9)
- [ ] Google shows "sKirana" on its login screen (after branding approval)
- [ ] Test 1.0.2 on phone: Google login, email code, send list → price in admin → price shows in app
- [ ] Release 1.0.2 to production (India, staged 20%), new store screenshots
- [ ] Later: phone OTP login (VerifyNow) + update privacy policy (still says email sign-in)
- [ ] Delete the 3 broken seed banners (Admin → Settings → Banners)
