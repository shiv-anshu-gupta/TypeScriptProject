// Public, no-login Privacy Policy + Terms page. This gives you the public URL
// (e.g. https://your-domain/privacy) that Google Play Console requires, and
// mirrors the in-app policy text.
//
// EDIT THESE for the real shop before publishing:
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "support@skirana.app"; // <-- put the shop's real email
const LAST_UPDATED = "July 2026";

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

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-neutral-800">
      <h1 className="text-2xl font-bold text-neutral-900">
        Privacy Policy &amp; Terms
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        {SHOP_NAME} · Last updated {LAST_UPDATED}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-neutral-900">
        Privacy Policy
      </h2>

      <Section title="About this app">
        <p>
          {SHOP_NAME} is a simple app that lets you send your grocery list to our
          shop, get a total from us, and pick up your order in person. This
          policy explains what we collect and how we use it.
        </p>
      </Section>

      <Section title="What we collect">
        <p>• Your email (used to sign in to your account).</p>
        <p>
          • Any name, phone number or address you choose to add (so we can
          prepare and identify your order).
        </p>
        <p>• The grocery lists you send us and their status.</p>
        <p>
          We only collect what we need to serve your order. We do not track your
          location in the background.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          To receive your list, prepare your order, quote a total, and let you
          know when it is ready to collect. We do not sell your data or use it
          for ads.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          Payment is made directly by you, from your own UPI app, to the shop's
          account — or in cash at the counter. We never see or store your card,
          bank or UPI PIN details.
        </p>
      </Section>

      <Section title="Who can see your data">
        <p>
          Only the shop, to fulfil your order. You can only see your own lists —
          not other customers'. We use trusted providers to run the app
          (sign-in, image hosting and database), who process data only on our
          behalf.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to show, correct or delete your data, or close your
          account, at any time — just contact us at{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . You agree to this policy when you create an account, and you can
          withdraw consent by deleting your account.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about your data? Email{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <h2 className="mt-10 text-xl font-semibold text-neutral-900">
        Terms of Use
      </h2>

      <Section title="What this is">
        <p>
          {SHOP_NAME} is a digital order-list tool for our shop. It is not an
          automated online store.
        </p>
      </Section>

      <Section title="Prices are an estimate">
        <p>
          The total shown in the app is a{" "}
          <span className="font-semibold text-neutral-900">
            proforma estimate
          </span>{" "}
          prepared for you by the shop. Prices may vary based on quantity and
          wholesale terms. Your final bill is issued at the shop counter when you
          collect and pay. Packaged items are never billed above their printed
          MRP.
        </p>
      </Section>

      <Section title="Payment & pickup">
        <p>
          Pay via UPI or at the counter, then collect your order in person.
          Please collect within 24 hours of the status showing "ready" —
          perishable items should be collected promptly for freshness.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          Items are subject to stock. The shop may adjust or cancel an order if
          something is unavailable, and will let you know.
        </p>
      </Section>

      <Section title="If a payment looks stuck">
        <p>
          A completed UPI payment is always valid even if the app is slow to
          update. If your screen looks out of date, show your bank transaction ID
          and your order number at the counter and we will verify it manually.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy from time to time. Continued use of the app
          means you accept the current version.
        </p>
      </Section>

      <p className="mt-10 text-xs text-neutral-400">
        © {SHOP_NAME}. All rights reserved.
      </p>
    </main>
  );
}
