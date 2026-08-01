import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Plain-language Privacy Policy + Terms tailored to this app's model:
// a digital order-list / quote tool for a single shop, with pay-and-collect
// in person. Not legal advice — have a professional skim it before launch.
//
// EDIT THESE for the real shop before publishing:
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "support@skirana.app"; // <-- put the shop's real email
const LAST_UPDATED = "July 2026";

function H({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 text-lg font-semibold text-foreground">
      {children}
    </Text>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 text-sm leading-6 text-muted-foreground">
      {children}
    </Text>
  );
}

export function LegalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-foreground">
        Privacy Policy & Terms
      </Text>
      <Text className="mt-1 text-xs text-muted-foreground">
        {SHOP_NAME} · Last updated {LAST_UPDATED}
      </Text>

      {/* ---------------- PRIVACY POLICY ---------------- */}
      <H>Privacy Policy</H>
      <P>
        {SHOP_NAME} is a simple app that lets you send your grocery list to our
        shop, get a total from us, and pick up your order in person. This policy
        explains what we collect and how we use it.
      </P>

      <H>What we collect</H>
      <P>• Your email (used to sign in to your account).</P>
      <P>
        • Any name, phone number or address you choose to add (so we can prepare
        and identify your order).
      </P>
      <P>• The grocery lists you send us and their status.</P>
      <P>
        We only collect what we need to serve your order. We do not track your
        location in the background.
      </P>

      <H>How we use it</H>
      <P>
        To receive your list, prepare your order, quote a total, and let you know
        when it is ready to collect. We do not sell your data or use it for ads.
      </P>

      <H>Payments</H>
      <P>
        Payment is made directly by you, from your own UPI app, to the shop's
        account — or in cash at the counter. We never see or store your card,
        bank or UPI PIN details.
      </P>

      <H>Who can see your data</H>
      <P>
        Only the shop, to fulfil your order. You can only see your own lists —
        not other customers'. We use trusted providers to run the app (sign-in,
        image hosting and database), who process data only on our behalf.
      </P>

      <H>Your rights</H>
      <P>
        You can ask us to show, correct or delete your data, or close your
        account, at any time — just contact us at {CONTACT_EMAIL}. You agree to
        this policy when you create an account, and you can withdraw consent by
        deleting your account.
      </P>

      <H>Contact</H>
      <P>Questions about your data? Email {CONTACT_EMAIL}.</P>

      {/* ---------------- TERMS ---------------- */}
      <H>Terms of Use</H>
      <P>
        {SHOP_NAME} is a digital order-list tool for our shop. It is not an
        automated online store.
      </P>

      <H>Prices are an estimate</H>
      <P>
        The total shown in the app is a <Text className="font-semibold text-foreground">proforma estimate</Text>{" "}
        prepared for you by the shop. Prices may vary based on quantity and
        wholesale terms. Your final bill is issued at the shop counter when you
        collect and pay. Packaged items are never billed above their printed MRP.
      </P>

      <H>Payment & pickup</H>
      <P>
        Pay via UPI or at the counter, then collect your order in person. Please
        collect within 24 hours of the status showing "ready" — perishable items
        should be collected promptly for freshness.
      </P>

      <H>Availability</H>
      <P>
        Items are subject to stock. The shop may adjust or cancel an order if
        something is unavailable, and will let you know.
      </P>

      <H>If a payment looks stuck</H>
      <P>
        A completed UPI payment is always valid even if the app is slow to
        update. If your screen looks out of date, show your bank transaction ID
        and your order number at the counter and we will verify it manually.
      </P>

      <H>Changes</H>
      <P>
        We may update this policy from time to time. Continued use of the app
        means you accept the current version.
      </P>
    </ScrollView>
  );
}
