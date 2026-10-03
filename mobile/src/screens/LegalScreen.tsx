/**
 * The privacy policy and terms, written into this file.
 *
 * @remarks
 * Plain-language Privacy Policy + Terms tailored to this app's model:
 * a digital order-list / quote tool for a single shop, with pay-and-collect
 * in person. Not legal advice — have a professional skim it before launch.
 *
 * @packageDocumentation
 */

import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  GRIEVANCE_DESIGNATION,
  GRIEVANCE_OFFICER,
  SELLER_ADDRESS,
  SELLER_NAME,
  SELLER_PHONE,
} from "@/lib/shop";

// EDIT THESE for the real shop before publishing:
const SHOP_NAME = "sKirana";
const CONTACT_EMAIL = "shivanshu2019gupta@gmail.com";
const LAST_UPDATED = "September 2026";

/**
 * A section heading in the legal text.
 */
function H({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 text-lg font-semibold text-foreground">
      {children}
    </Text>
  );
}

/**
 * A paragraph in the legal text.
 */
function P({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 text-sm leading-6 text-muted-foreground">
      {children}
    </Text>
  );
}

/**
 * The privacy policy and terms as one scrolling page, reached from Account and
 * from the consent line under the login.
 *
 * @remarks
 * The text is hard-coded here rather than translated or fetched, so it is the
 * same wording for every customer and ships with the build. It reads no store
 * and loads nothing.
 *
 * `SHOP_NAME`, `CONTACT_EMAIL` and `LAST_UPDATED` at the top of this file must
 * be edited for a real shop before publishing.
 *
 * It describes the photo flow — the photo is read and discarded, and never
 * stored. Keep that in step with what the camera button actually does.
 */
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

      {/* Seller and complaints first: the law wants them easy to find,
          and this is where Account -> Shop details & complaints lands. */}
      <H>Seller</H>
      <P>
        {SHOP_NAME} is the app of{" "}
        <Text className="font-semibold text-foreground">{SELLER_NAME}</Text>,{" "}
        {SELLER_ADDRESS}.
        {SELLER_PHONE ? ` Customer care: ${SELLER_PHONE}.` : ""}
      </P>

      <H>Complaints</H>
      <P>
        {GRIEVANCE_OFFICER
          ? `Grievance officer: ${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}, ${SELLER_NAME}. `
          : ""}
        {SELLER_PHONE ? `Call ${SELLER_PHONE}, or tell us in the shop. ` : "Tell us in the shop. "}
        We acknowledge every complaint within 48 hours and resolve it within
        one month. You can also contact the National Consumer Helpline on 1915.
      </P>

      {/* ---------------- PRIVACY POLICY ---------------- */}
      <H>Privacy Policy</H>
      <P>
        {SHOP_NAME} is a simple app that lets you send your grocery list to our
        shop, get a total from us, and pick up your order in person. This policy
        explains what we collect and how we use it.
      </P>

      <H>What we collect</H>
      <P>
        • Your name and email address, from Google sign-in or the email code you
        sign in with.
      </P>
      <P>
        • Your mobile number, which we ask for the first time you send a list, so
        the shop can call you about your order. You can change it in your
        account.
      </P>
      <P>
        • The grocery lists you send, their status, and the messages you exchange
        with the shop about an order.
      </P>
      <P>
        • A notification token for your phone, so we can tell you when your list
        is priced or ready. You can turn notifications off in your phone's
        settings.
      </P>
      <P>
        We do not access your location, contacts or microphone, and the app
        contains no advertising or analytics tools.
      </P>

      <H>Photos of your list</H>
      <P>
        If you choose to photograph your handwritten list, the app uses your
        camera — or a photo you pick from your gallery — only at that moment.
      </P>
      <P>
        The photo is sent securely to our server and read by Google's Gemini AI
        service, which turns it into text. The items appear in your list for you
        to check and correct before you send it. We do not keep the photo: it is
        not saved on our server, in our database, or with your order.
      </P>
      <P>
        Google processes the photo under its own terms, and may keep it for a
        limited time and use it to improve its services. Please photograph only
        your grocery list, not anything personal.
      </P>

      <H>How we use it</H>
      <P>
        To receive your list, prepare your order, quote a total, and let you
        know when it is ready to collect. We do not sell your data or use it for
        ads.
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
        not other customers'.
      </P>
      <P>
        When you send a list or a message, the shop is alerted with your name,
        mobile number and order number — in the shop's own app and in its private
        Telegram chat.
      </P>
      <P>
        We use trusted providers to run the app, who process data to provide
        their service: Clerk (sign-in), MongoDB Atlas (database), Vercel
        (hosting), Cloudinary (product pictures), Expo and Google Firebase (phone
        notifications), Telegram (shop alerts) and Google Gemini (reading photos
        of lists).
      </P>

      <H>How long we keep it</H>
      <P>
        Your account and lists are kept while your account is active, so you
        can see your past orders. Chat messages delete themselves after 30 days.
        Photos of lists are never kept. You can delete your account yourself
        here in the app (Account → Delete my account) and it is deleted straight
        away; if you ask us by email instead, we delete it within 7 days. Either
        way it is gone from backups within 30 days.
      </P>

      <H>Children</H>
      <P>{SHOP_NAME} is meant for adults. It is not intended for anyone under 18.</P>

      <H>Your rights</H>
      <P>
        You can ask us to show, correct or delete your data, or close your
        account, at any time — email {CONTACT_EMAIL} (how deletion works:
        skirana.com/delete-account). You agree to this policy when you create an
        account, and you can withdraw consent by deleting your account.
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
        The total shown in the app is a{" "}
        <Text className="font-semibold text-foreground">proforma estimate</Text>{" "}
        prepared for you by the shop. Prices may vary based on quantity and
        wholesale terms. Your final bill is issued at the shop counter when you
        collect and pay. We do not charge more than the printed MRP for a
        packaged item; if you ever find that we have, tell us at the counter and
        we will correct it.
      </P>

      <H>Prices and GST</H>
      <P>
        Prices include GST where it applies. Your GST bill is given at the
        counter.
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

      <H>If you have paid by UPI</H>
      <P>
        If the final bill is lower than what you paid, we return the difference.
        If it would be higher, we tell you before you pay any more, and you can
        remove items or cancel instead.
      </P>

      <H>Cancelling an order</H>
      <P>
        You can cancel an order yourself in the app (Lists → your order → Cancel
        this order) until the shop starts packing it. After that, message or call
        the shop and we will cancel it for you. There is never a cancellation
        charge.
      </P>

      <H>Refunds</H>
      <P>
        If you paid for an order that is cancelled - by you or by us - or for an
        item we could not supply, we refund it to the same UPI account within 3
        working days, or in cash at the counter if you prefer. If an item you
        collected is damaged, spoiled, past its date, or not what you ordered,
        bring it back with your order number within 2 days and we will replace
        it or refund it.
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
