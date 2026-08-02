// Public, no-login "Delete account & data" page. This is the URL Google Play
// requires under Data safety → account deletion. Mirrors the privacy page.
//
// EDIT THESE for the real shop before publishing (keep in sync with Privacy):
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "shivanshu2019gupta@gmail.com";
const LAST_UPDATED = "August 2026";

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
