/**
 * The public account-deletion instructions page.
 *
 * @remarks
 * Mounted at `/delete-account` in `router.tsx`. Like the privacy page it is
 * declared outside every layout guard, so it needs no sign-in; these legal
 * routes are the only unguarded ones in the admin web app. The URL is required
 * by app-store policy under data safety, and the privacy page links to it.
 *
 * The page only explains the process. Deletion is handled by hand, by email or
 * in person — there is no form, no button and no endpoint behind it, so
 * nothing here calls the API.
 *
 * It is still served through the SPA: `client/vercel.json` rewrites unmatched
 * paths to `/app.html`, so React boots before this static prose renders.
 *
 * The copy is policy text. The stated windows — deletion within 7 days,
 * backups purged within 30 — and the list of what is removed must match
 * `pages/legal/Privacy.tsx` and what the shop actually does.
 *
 * @packageDocumentation
 */

// Public, no-login "Delete account & data" page. This is the URL Google Play
// requires under Data safety → account deletion. Mirrors the privacy page.
//
// EDIT THESE for the real shop before publishing (keep in sync with Privacy):
/**
 * Shop identity, contact address and policy date interpolated into the copy.
 *
 * @remarks
 * Duplicated from `pages/legal/Privacy.tsx` rather than shared, so a change
 * there does not reach here. Keep the two sets in sync by hand, as the note
 * above says. `LAST_UPDATED` is shown to the reader and currently differs
 * from the privacy page's date, which is expected: each page carries the date
 * its own wording last changed.
 */
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "shivanshu2019gupta@gmail.com";
const LAST_UPDATED = "August 2026";

/**
 * A titled block of policy prose.
 *
 * @remarks
 * A local copy of the identical helper in `pages/legal/Privacy.tsx`; neither
 * file imports the other, so a styling change must be made in both.
 *
 * @param title - Heading text for the section.
 * @param children - Paragraphs of policy text.
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-neutral-600">
        {children}
      </div>
    </section>
  );
}

/**
 * Renders the deletion instructions, what is removed, and the timings.
 *
 * @remarks
 * Takes no props, holds no state and makes no requests. The only interactive
 * elements are `mailto:` links built from `CONTACT_EMAIL`, so the whole flow
 * depends on that address being monitored.
 *
 * The prose describes a manual process: the customer emails from the address
 * they signed in with, the shop verifies and deletes. It also describes
 * partial deletion the customer can do themselves in the mobile app — removing
 * a saved address, or removing items from a list before packing starts — so
 * the wording must match what the mobile app still allows.
 *
 * Treat the 7-day and 30-day figures as commitments published to an app store,
 * and keep them identical to the privacy page.
 */
export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-neutral-800">
      <h1 className="text-2xl font-bold text-neutral-900">
        Delete your {SHOP_NAME} account
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        {SHOP_NAME} · Last updated {LAST_UPDATED}
      </p>

      <p className="mt-4 text-sm leading-6 text-neutral-600">
        You can delete your {SHOP_NAME} account and all associated data at any
        time. This page explains how to request it and what happens.
      </p>

      <Section title="How to request deletion">
        <p>1. From the email address you signed in with, email us at{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject <b>“Delete my account”</b>.
        </p>
        <p>
          2. We verify the request is from you (using your registered email),
          then delete your account.
        </p>
        <p>
          You can also ask in person at the shop — bring the phone number or
          email linked to your account.
        </p>
      </Section>

      <Section title="What gets deleted">
        <p>Your account and everything tied to it:</p>
        <p>• Your name, email, and phone number</p>
        <p>• Any saved addresses</p>
        <p>• All your grocery lists and their history</p>
      </Section>

      <Section title="Delete only some data (keep your account)">
        <p>
          You don't have to delete your whole account to remove data:
        </p>
        <p>• In the app, delete any <b>saved address</b> (Account → Addresses → Delete).</p>
        <p>• <b>Remove items</b> from a list before the shop starts packing it.</p>
        <p>
          • To remove any other specific data, email us at{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          and tell us what to delete — your account stays active.
        </p>
      </Section>

      <Section title="What we keep">
        <p>
          Nothing personal is retained after deletion. Backup copies are fully
          removed within <b>30 days</b>. We do not keep your data for marketing
          or sell it to anyone.
        </p>
      </Section>

      <Section title="How long it takes">
        <p>
          We delete your account within <b>7 days</b> of a verified request, and
          purge it from backups within <b>30 days</b>.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions? Email{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <p className="mt-10 text-xs text-neutral-400">
        © {SHOP_NAME}. All rights reserved.
      </p>
    </main>
  );
}
