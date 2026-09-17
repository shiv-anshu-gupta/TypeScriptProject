// Public, no-login Privacy Policy + Terms page. This gives you the public URL
// (e.g. https://your-domain/privacy) that Google Play Console requires, and
// mirrors the in-app policy text.
//
// EDIT THESE for the real shop before publishing:
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "shivanshu2019gupta@gmail.com";
const LAST_UPDATED = "September 2026";

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
        <p>
          • Your name and email address, from Google sign-in or the email code
          you sign in with.
        </p>
        <p>
          • Your mobile number, which we ask for the first time you send a list,
          so the shop can call you about your order. You can change it in your
          account.
        </p>
        <p>
          • The grocery lists you send, their status, and the messages you
          exchange with the shop about an order.
        </p>
        <p>
          • A notification token for your phone, so we can tell you when your
          list is priced or ready. You can turn notifications off in your phone's
          settings.
        </p>
        <p>
          We do not access your location, contacts or microphone, and the app
          contains no advertising or analytics tools.
        </p>
      </Section>

      <Section title="Photos of your list">
        <p>
          If you choose to photograph your handwritten list, the app uses your
          camera — or a photo you pick from your gallery — only at that moment.
        </p>
        <p>
          The photo is sent securely to our server and read by Google&apos;s
          Gemini AI service, which turns it into text. The items appear in your
          list for you to check and correct before you send it. We do not keep
          the photo: it is not saved on our server, in our database, or with
          your order.
        </p>
        <p>
          Google processes the photo under its own terms, and may keep it for a
          limited time and use it to improve its services. Please photograph
          only your grocery list, not anything personal.
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
          not other customers&apos;.
        </p>
        <p>
          When you send a list or a message, the shop is alerted with your name,
          mobile number and order number — in the shop&apos;s own app and in
          its private Telegram chat.
        </p>
        <p>
          We use trusted providers to run the app, who process data to provide
          their service: Clerk (sign-in), MongoDB Atlas (database), Vercel
          (hosting), Cloudinary (product pictures), Expo and Google Firebase
          (phone notifications), Telegram (shop alerts) and Google Gemini
          (reading photos of lists).
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Your account, lists and messages are kept while your account is
          active, so you can see your past orders. Photos of lists are never
          kept. When you ask us to delete your account, we delete it within 7
          days and remove it from backups within 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>
          {SHOP_NAME} is meant for adults. It is not intended for anyone under
          18.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to show, correct or delete your data, or close your
          account, at any time — email{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          (how deletion works:{" "}
          <a className="underline" href="/delete-account">
            skirana.com/delete-account
          </a>
          ). You agree to this policy when you create an account, and you can
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
