/**
 * The text of the three policy documents - Terms & Conditions, Privacy
 * Policy, Refund Policy - in English and Hindi.
 *
 * @remarks
 * This file is IDENTICAL in `mobile/src/lib/legal/` and
 * `client/src/lib/legal/`; change both together, byte for byte.
 *
 * Every fact about data must match what the app and server actually do:
 * the photo flow (read by Google Gemini, never kept by us), the named
 * processors, the 30-day chat expiry, and the deletion rules in
 * `server/src/services/deleteAccount.ts`. The seller and grievance details
 * come from `@/lib/shop` and are never typed in here.
 *
 * English and Hindi of each document have the same sections in the same
 * order. A paragraph that starts with "• " is drawn as a bullet.
 *
 * @packageDocumentation
 */
import {
  CONTACT_EMAIL,
  GRIEVANCE_DESIGNATION,
  GRIEVANCE_OFFICER,
  SELLER_ADDRESS,
  SELLER_NAME,
  SELLER_PHONE,
} from "@/lib/shop";

import type { LegalDoc, LegalLibrary } from "./types";

const UPDATED_EN = "Last updated: 4 October 2026";
const UPDATED_HI = "अंतिम अपडेट: 4 अक्टूबर 2026";

// ---------------------------------------------------------------------------
// Terms & Conditions
// ---------------------------------------------------------------------------

const termsEn: LegalDoc = {
  title: "Terms & Conditions",
  updated: UPDATED_EN,
  intro: `These terms are the agreement between you and ${SELLER_NAME} when you use the sKirana app. Please read them together with our Privacy Policy and our Refund Policy.`,
  sections: [
    {
      heading: "Who we are",
      body: [
        `sKirana is the app of ${SELLER_NAME}, ${SELLER_ADDRESS}. ${SELLER_NAME} is the seller of everything you order through the app.`,
        `Customer care: ${SELLER_PHONE}. You can also talk to us in the shop.`,
      ],
    },
    {
      heading: "What sKirana is",
      body: [
        "sKirana is an order-list tool for our one shop. You write your grocery list in the app, the shop prices it, and you collect your order in person at the shop.",
        "It is not an automated online store. There is no delivery and there are no other sellers. A person at the shop reads every list.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "• Give your real name and a mobile number the shop can call you on, and keep them up to date.",
        "• Keep your sign-in safe: your Google account, or the email you receive your OTP on. Tell us straight away if you think someone else is using your account.",
        "• You must be 18 or older to use sKirana.",
      ],
    },
    {
      heading: "Prices, GST and your final bill",
      body: [
        "The total the shop shows you in the app is a proforma estimate. Prices may vary with quantity and wholesale terms.",
        "Your final bill is made at the counter when you collect your order. Prices include GST where it applies, and your GST bill is given to you at the counter.",
        "We never charge more than the MRP printed on a packaged item. If you ever find that we have, tell us and we will correct it.",
      ],
    },
    {
      heading: "Paying",
      body: [
        "You can pay by UPI, from your own UPI app straight to the shop's UPI id, or you can pay at the counter when you collect.",
        "The shop marks a UPI payment as received once the money has reached its account. This can take a little while.",
        "A completed UPI payment is always valid, even if the app has not caught up. If the app looks out of date, show your bank transaction ID and your order number at the counter and we will check it by hand.",
      ],
    },
    {
      heading: "Collecting your order",
      body: [
        "When your order shows “Ready to collect”, please come to the shop and collect it within 24 hours.",
        "If you cannot come within 24 hours, message or call us. If you do not collect it and we do not hear from you, the shop may cancel the order and put the items back on the shelf. Anything you paid is then refunded under our Refund Policy.",
        "Please check your order at the counter before you leave. Our Refund Policy explains why.",
      ],
    },
    {
      heading: "Cancelling an order",
      body: [
        "You can cancel an order yourself in the app (Lists → your order → ⋯ → Cancel this order) until the shop starts packing it.",
        "Once packing has started, message or call the shop and we will cancel it for you.",
        "There is never a cancellation charge. If you had already paid, your money comes back under our Refund Policy.",
      ],
    },
    {
      heading: "If something is not available",
      body: [
        "Items depend on what is in stock. If something you asked for is not available, the shop may adjust your order or cancel it, and will tell you. You are never charged for an item you did not get.",
      ],
    },
    {
      heading: "Fair use",
      body: [
        "Please do not:",
        "• send fake or prank orders;",
        "• abuse or threaten the shop owner or staff, in chat, on the phone or in person;",
        "• misuse the app, for example by trying to get into someone else's account, or to break or overload the app.",
        "The app also has limits on how many lists you can send in a day, how many messages you can send in an hour, and how many photos it can read for you in a day. A normal household never reaches them.",
        "If an account does any of these things, the shop may limit it, suspend it or close it. Anything you have already paid for is still handed over to you or refunded.",
      ],
    },
    {
      heading: "Our other policies",
      body: [
        "Our Privacy Policy explains what we collect about you and how we use it. Our Refund Policy explains replacements, returns and refunds. Both are part of these terms.",
        "Nothing in these terms takes away your rights under the Consumer Protection Act, 2019 or any other law.",
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "We may change these terms. When we do, the date at the top of this page changes. If you keep using the app after that, you accept the new terms. If you do not agree, you can stop using the app and delete your account.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of India. Any dispute is subject to the courts that have jurisdiction over the place where the shop is located.",
        "This does not stop you from going to a consumer commission as the law allows.",
      ],
    },
    {
      heading: "Complaints",
      body: [
        `Grievance officer: ${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}, ${SELLER_NAME}.`,
        `Phone: ${SELLER_PHONE}. Email: ${CONTACT_EMAIL}. Or tell us in the shop.`,
        "We acknowledge every complaint within 48 hours and resolve it within one month.",
        "If you are not satisfied, you can contact the National Consumer Helpline on 1915 or at consumerhelpline.gov.in.",
      ],
    },
  ],
};

const termsHi: LegalDoc = {
  title: "नियम और शर्तें",
  updated: UPDATED_HI,
  intro: `sKirana app इस्तेमाल करने पर आपके और ${SELLER_NAME} के बीच यही शर्तें लागू होती हैं। इन्हें हमारी गोपनीयता नीति और रिफ़ंड नीति के साथ पढ़ें।`,
  sections: [
    {
      heading: "हम कौन हैं",
      body: [
        `sKirana, ${SELLER_NAME}, ${SELLER_ADDRESS} का app है। app से आप जो भी सामान मँगाते हैं, उसका विक्रेता ${SELLER_NAME} है।`,
        `ग्राहक सेवा: ${SELLER_PHONE}। आप दुकान पर आकर भी बात कर सकते हैं।`,
      ],
    },
    {
      heading: "sKirana क्या है",
      body: [
        "sKirana हमारी एक दुकान को order की लिस्ट भेजने का app है। आप app में अपनी किराने की लिस्ट लिखते हैं, दुकान उसका दाम बताती है, और आप दुकान पर आकर खुद सामान ले जाते हैं।",
        "यह अपने-आप चलने वाला online store नहीं है। इसमें होम डिलीवरी नहीं है और कोई दूसरा विक्रेता नहीं है। हर लिस्ट दुकान का कोई व्यक्ति खुद पढ़ता है।",
      ],
    },
    {
      heading: "आपका account",
      body: [
        "• अपना सही नाम और ऐसा मोबाइल नंबर दें जिस पर दुकान आपको फ़ोन कर सके। बदलने पर इन्हें अपडेट करें।",
        "• अपना sign-in सुरक्षित रखें: आपका Google account, या वह email जिस पर आपका OTP आता है। अगर लगे कि कोई और आपका account चला रहा है, तो तुरंत हमें बताएँ।",
        "• sKirana इस्तेमाल करने के लिए आपकी उम्र कम से कम 18 साल होनी चाहिए।",
      ],
    },
    {
      heading: "दाम, GST और आख़िरी बिल",
      body: [
        "app में दुकान जो कुल रकम दिखाती है, वह एक अनुमान (proforma estimate) है। मात्रा और थोक के भाव के हिसाब से दाम बदल सकते हैं।",
        "आपका आख़िरी बिल काउंटर पर बनता है, जब आप सामान लेने आते हैं। जहाँ GST लगता है, वह दाम में शामिल है। GST बिल आपको काउंटर पर मिलता है।",
        "पैक किए हुए सामान पर छपे MRP से ज़्यादा हम कभी नहीं लेते। अगर कभी ऐसा हुआ हो, तो हमें बताएँ, हम उसे ठीक करेंगे।",
      ],
    },
    {
      heading: "पेमेंट",
      body: [
        "आप अपने UPI app से सीधे दुकान की UPI id पर पेमेंट कर सकते हैं, या सामान लेते समय काउंटर पर पेमेंट कर सकते हैं।",
        "पैसा दुकान के खाते में पहुँचने के बाद दुकान UPI पेमेंट को पक्का करती है। इसमें थोड़ा समय लग सकता है।",
        "पूरा हो चुका UPI पेमेंट हमेशा मान्य है, भले ही app में अभी न दिखे। अगर app पुराना हाल दिखा रहा हो, तो काउंटर पर अपना बैंक transaction ID और order नंबर दिखाएँ। हम खुद जाँच लेंगे।",
      ],
    },
    {
      heading: "सामान लेने आना",
      body: [
        "जब आपके order पर “लेने आएँ” दिखे, तो कृपया 24 घंटे के अंदर दुकान आकर सामान ले जाएँ।",
        "अगर 24 घंटे में न आ सकें, तो हमें message या फ़ोन करें। अगर आप सामान नहीं लेते और आपकी कोई ख़बर नहीं मिलती, तो दुकान order रद्द करके सामान वापस रख सकती है। आपने जो पैसा दिया है, वह रिफ़ंड नीति के अनुसार लौटाया जाएगा।",
        "दुकान से जाने से पहले काउंटर पर ही सामान जाँच लें। क्यों, यह रिफ़ंड नीति में लिखा है।",
      ],
    },
    {
      heading: "order रद्द करना",
      body: [
        "जब तक दुकान पैकिंग शुरू नहीं करती, आप app में खुद order रद्द कर सकते हैं (लिस्ट → आपका order → ⋯ → यह order रद्द करें)।",
        "पैकिंग शुरू होने के बाद दुकान को message या फ़ोन करें। हम आपके लिए order रद्द कर देंगे।",
        "order रद्द करने का कोई चार्ज कभी नहीं लगता। अगर आपने पहले ही पेमेंट कर दिया था, तो पैसा रिफ़ंड नीति के अनुसार वापस मिलेगा।",
      ],
    },
    {
      heading: "अगर कोई सामान न हो",
      body: [
        "सामान स्टॉक पर निर्भर है। अगर आपका माँगा कोई सामान नहीं है, तो दुकान order में बदलाव कर सकती है या उसे रद्द कर सकती है, और आपको बताएगी। जो सामान आपको नहीं मिला, उसका पैसा आपसे कभी नहीं लिया जाएगा।",
      ],
    },
    {
      heading: "सही इस्तेमाल",
      body: [
        "कृपया ये काम न करें:",
        "• झूठे या मज़ाक वाले order भेजना;",
        "• दुकान के मालिक या कर्मचारियों से गाली-गलौज या धमकी, चाहे chat में, फ़ोन पर या दुकान पर;",
        "• app का ग़लत इस्तेमाल, जैसे किसी और के account में घुसने की, या app को बिगाड़ने या उस पर बोझ डालने की कोशिश।",
        "app में कुछ सीमाएँ भी हैं: एक दिन में कितनी लिस्ट भेजी जा सकती हैं, एक घंटे में कितने message, और एक दिन में कितनी फ़ोटो पढ़ी जा सकती हैं। आम परिवार इन सीमाओं तक कभी नहीं पहुँचता।",
        "जो account ऐसा करता है, दुकान उसे सीमित कर सकती है, कुछ समय के लिए रोक सकती है या बंद कर सकती है। जिस सामान का पैसा आप दे चुके हैं, वह फिर भी आपको मिलेगा या उसका पैसा लौटाया जाएगा।",
      ],
    },
    {
      heading: "हमारी दूसरी नीतियाँ",
      body: [
        "हमारी गोपनीयता नीति बताती है कि हम आपकी कौन-सी जानकारी लेते हैं और उसका क्या करते हैं। हमारी रिफ़ंड नीति बताती है कि सामान बदलना, लौटाना और पैसा वापस कैसे होता है। दोनों इन शर्तों का हिस्सा हैं।",
        "इन शर्तों की कोई भी बात, उपभोक्ता संरक्षण अधिनियम 2019 या किसी और कानून के तहत आपके अधिकार कम नहीं करती।",
      ],
    },
    {
      heading: "इन शर्तों में बदलाव",
      body: [
        "हम इन शर्तों को बदल सकते हैं। बदलने पर इस पेज के ऊपर की तारीख़ बदल जाएगी। उसके बाद भी app इस्तेमाल करते रहने का मतलब है कि आप नई शर्तें मानते हैं। अगर आप सहमत नहीं हैं, तो app इस्तेमाल करना बंद करके अपना account मिटा सकते हैं।",
      ],
    },
    {
      heading: "कानून और अदालत",
      body: [
        "ये शर्तें भारत के कानून के अनुसार हैं। कोई भी विवाद उन अदालतों के अधिकार में होगा जिनके क्षेत्र में दुकान है।",
        "इससे कानून के अनुसार उपभोक्ता आयोग में जाने का आपका अधिकार ख़त्म नहीं होता।",
      ],
    },
    {
      heading: "शिकायत",
      body: [
        `शिकायत अधिकारी: ${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}, ${SELLER_NAME}।`,
        `फ़ोन: ${SELLER_PHONE}। email: ${CONTACT_EMAIL}। या दुकान पर आकर बताएँ।`,
        "हर शिकायत मिलने की पुष्टि हम 48 घंटे के अंदर करते हैं, और एक महीने के अंदर उसका हल करते हैं।",
        "अगर आप संतुष्ट नहीं हैं, तो राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर या consumerhelpline.gov.in पर संपर्क कर सकते हैं।",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  updated: UPDATED_EN,
  intro: `This policy explains what the sKirana app collects about you, why, who can see it, and how you can have it deleted. sKirana is run by ${SELLER_NAME}, which is responsible for your data.`,
  sections: [
    {
      heading: "What we collect",
      body: [
        "• Your name and email address, from Google sign-in or the email you sign in with using an OTP.",
        "• Your mobile number, which we ask for the first time you send a list, so the shop can call you about your order. You can change it in Account.",
        "• The grocery lists you send, their status, and the messages you exchange with the shop about an order.",
        "• A notification token for your phone, so we can tell you when your list is priced or ready. You can turn notifications off in your phone's settings.",
        "We do not access your location, contacts or microphone. The app has no advertising or analytics tools.",
        "You pay from your own UPI app straight to the shop, or at the counter. We never see or store your card, bank or UPI PIN details.",
      ],
    },
    {
      heading: "Photos of your list",
      body: [
        "If you choose to photograph your handwritten list, the app uses your camera, or a photo you pick from your gallery, only at that moment.",
        "The photo is sent securely to our server and read by Google's Gemini AI service, which turns it into text. The items appear in your list for you to check and correct before you send it. We do not keep the photo: it is not saved on our server, in our database, or with your order.",
        "Google processes the photo under its own terms, and may keep it for a limited time and use it to improve its services. Please photograph only your grocery list, not anything personal.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "• To receive your list, price it, pack your order, and tell you when it is ready to collect.",
        "• To call or message you about your order.",
        "We do not sell your data and we do not use it for ads.",
      ],
    },
    {
      heading: "Who can see it",
      body: [
        "Only the shop, to fulfil your order. You can see only your own lists, not other customers'.",
        "When you send a list or a message, the shop is alerted with your name, mobile number and order number, in the shop's own app and in its private Telegram chat.",
        "We use trusted providers to run the app, who process data to provide their service: Clerk (sign-in), MongoDB Atlas (database), Vercel (hosting), Cloudinary (product pictures), Expo and Google Firebase (phone notifications), Telegram (shop alerts) and Google Gemini (reading photos of lists).",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "• Your account and lists: while your account is active, so you can see your past orders.",
        "• Chat messages: deleted automatically 30 days after they are sent.",
        "• Photos of your list: never kept by us.",
        "• After you delete your account: the shop keeps each past order's items, prices, total, dates and payment state as its sales record. Your name, email, phone and note are removed from it, so it no longer says who you are. Backup copies are gone within 30 days.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can ask us to:",
        "• show you the data we hold about you;",
        "• correct it (you can also change your mobile number yourself in Account);",
        "• delete it;",
        "• stop using it, by withdrawing your consent: delete your account to do this;",
        "• look into a complaint, through our grievance officer (see below).",
        `Email ${CONTACT_EMAIL} for any of these. You agree to this policy when you create an account.`,
      ],
    },
    {
      heading: "Deleting your account",
      body: [
        "In the app: Account → Delete my account. Your account is deleted straight away.",
        `By email: write to ${CONTACT_EMAIL} from the email address you sign in with, with the subject “Delete my account”. We delete it within 7 days.`,
        "If you have an order you have paid for but not yet collected, please collect it or take your refund first, so the record of your payment is not lost. An open order you have not paid for is simply cancelled.",
        "What is deleted: your name, email, mobile number, your chat messages, and your sign-in. What the shop keeps is described under “How long we keep it”.",
        "More detail: skirana.com/delete-account",
      ],
    },
    {
      heading: "Children",
      body: [
        "sKirana is meant for adults. It is not intended for anyone under 18, and we do not knowingly collect data about children.",
      ],
    },
    {
      heading: "Security",
      body: [
        "We use reasonable safeguards to protect your data. The app talks to our server over an encrypted connection, and a customer can reach only their own data.",
        "Shop staff see only what they need to prepare your order, and only from the shop's own network.",
      ],
    },
    {
      heading: "Contact and grievance officer",
      body: [
        `Grievance officer: ${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}, ${SELLER_NAME}.`,
        `Phone: ${SELLER_PHONE}. Email: ${CONTACT_EMAIL}. Or tell us in the shop.`,
        "We acknowledge every complaint within 48 hours and resolve it within one month.",
      ],
    },
  ],
};

const privacyHi: LegalDoc = {
  title: "गोपनीयता नीति",
  updated: UPDATED_HI,
  intro: `यह नीति बताती है कि sKirana app आपकी कौन-सी जानकारी लेता है, क्यों लेता है, उसे कौन देख सकता है, और आप उसे कैसे मिटवा सकते हैं। sKirana को ${SELLER_NAME} चलाता है, और आपकी जानकारी की ज़िम्मेदारी उसी की है।`,
  sections: [
    {
      heading: "हम क्या जानकारी लेते हैं",
      body: [
        "• आपका नाम और email, Google sign-in से या उस email से जिससे आप OTP के ज़रिए sign in करते हैं।",
        "• आपका मोबाइल नंबर। पहली बार लिस्ट भेजते समय हम इसे माँगते हैं, ताकि दुकान आपके order के बारे में आपको फ़ोन कर सके। आप इसे Account में बदल सकते हैं।",
        "• आपकी भेजी हुई लिस्ट, उनका status, और order के बारे में दुकान से आपकी chat।",
        "• आपके फ़ोन का notification token, ताकि लिस्ट का दाम लगने पर या सामान तैयार होने पर हम आपको बता सकें। आप फ़ोन की settings में notifications बंद कर सकते हैं।",
        "हम आपकी location, contacts या माइक्रोफ़ोन तक नहीं पहुँचते। app में कोई विज्ञापन या analytics tool नहीं है।",
        "पेमेंट आप खुद अपने UPI app से सीधे दुकान को करते हैं, या काउंटर पर। आपके card, बैंक या UPI PIN की जानकारी हम कभी नहीं देखते और न रखते हैं।",
      ],
    },
    {
      heading: "आपकी लिस्ट की फ़ोटो",
      body: [
        "अगर आप अपनी हाथ से लिखी लिस्ट की फ़ोटो लेते हैं, तो app आपका कैमरा, या gallery से चुनी फ़ोटो, सिर्फ़ उसी समय इस्तेमाल करता है।",
        "फ़ोटो सुरक्षित तरीके से हमारे server पर जाती है, और Google की Gemini AI सेवा उसे पढ़कर text में बदलती है। सामान आपकी लिस्ट में आ जाता है, और भेजने से पहले आप उसे जाँचकर ठीक कर सकते हैं। हम फ़ोटो नहीं रखते: वह न हमारे server पर सेव होती है, न database में, न आपके order के साथ।",
        "Google यह फ़ोटो अपनी शर्तों के अनुसार प्रोसेस करता है। वह इसे कुछ समय तक रख सकता है और अपनी सेवाएँ बेहतर बनाने में इस्तेमाल कर सकता है। इसलिए सिर्फ़ अपनी किराने की लिस्ट की फ़ोटो लें, कोई निजी चीज़ नहीं।",
      ],
    },
    {
      heading: "हम जानकारी का क्या करते हैं",
      body: [
        "• आपकी लिस्ट लेने, उसका दाम लगाने, सामान पैक करने, और सामान तैयार होने पर आपको बताने के लिए।",
        "• आपके order के बारे में आपको फ़ोन या message करने के लिए।",
        "हम आपकी जानकारी बेचते नहीं हैं, और विज्ञापन के लिए इस्तेमाल नहीं करते।",
      ],
    },
    {
      heading: "जानकारी कौन देख सकता है",
      body: [
        "सिर्फ़ दुकान, आपका order पूरा करने के लिए। आप सिर्फ़ अपनी लिस्ट देख सकते हैं, दूसरे ग्राहकों की नहीं।",
        "जब आप लिस्ट या message भेजते हैं, तो दुकान को आपके नाम, मोबाइल नंबर और order नंबर के साथ सूचना जाती है, दुकान के अपने app में और उसकी निजी Telegram chat में।",
        "app चलाने के लिए हम भरोसेमंद सेवाओं का इस्तेमाल करते हैं, जो अपनी सेवा देने के लिए डेटा प्रोसेस करती हैं: Clerk (sign-in), MongoDB Atlas (database), Vercel (hosting), Cloudinary (सामान की तस्वीरें), Expo और Google Firebase (फ़ोन notifications), Telegram (दुकान को सूचना) और Google Gemini (लिस्ट की फ़ोटो पढ़ना)।",
      ],
    },
    {
      heading: "हम जानकारी कब तक रखते हैं",
      body: [
        "• आपका account और लिस्ट: जब तक आपका account चालू है, ताकि आप अपने पुराने order देख सकें।",
        "• chat messages: भेजने के 30 दिन बाद अपने-आप मिट जाते हैं।",
        "• आपकी लिस्ट की फ़ोटो: हम कभी नहीं रखते।",
        "• account मिटाने के बाद: दुकान अपनी बिक्री के रिकॉर्ड के लिए हर पुराने order का सामान, दाम, कुल रकम, तारीख़ें और पेमेंट की स्थिति रखती है। उसमें से आपका नाम, email, फ़ोन और note हटा दिया जाता है, ताकि उससे पता न चले कि वह order आपका था। backup की कॉपी 30 दिन के अंदर मिट जाती है।",
      ],
    },
    {
      heading: "आपके अधिकार",
      body: [
        "आप हमसे कह सकते हैं कि:",
        "• आपकी जो जानकारी हमारे पास है, वह आपको दिखाएँ;",
        "• उसे ठीक करें (मोबाइल नंबर आप Account में खुद भी बदल सकते हैं);",
        "• उसे मिटा दें;",
        "• उसका इस्तेमाल बंद करें, यानी आप अपनी सहमति वापस लें: इसके लिए अपना account मिटा दें;",
        "• आपकी शिकायत सुनें, हमारे शिकायत अधिकारी के ज़रिए (नीचे देखें)।",
        `इनमें से किसी के लिए ${CONTACT_EMAIL} पर email करें। account बनाते समय आप इस नीति से सहमत होते हैं।`,
      ],
    },
    {
      heading: "अपना account मिटाना",
      body: [
        "app में: अकाउंट → मेरा खाता मिटाएँ। आपका account उसी समय मिट जाता है।",
        `email से: जिस email से आप sign in करते हैं, उसी से ${CONTACT_EMAIL} पर “Delete my account” विषय के साथ email भेजें। हम 7 दिन के अंदर account मिटा देंगे।`,
        "अगर आपने किसी order का पैसा दे दिया है पर सामान अभी नहीं लिया, तो पहले सामान ले लें या रिफ़ंड ले लें, ताकि आपके पेमेंट का रिकॉर्ड न खोए। बिना पेमेंट वाला खुला order अपने-आप रद्द हो जाता है।",
        "क्या मिटता है: आपका नाम, email, मोबाइल नंबर, आपकी chat, और आपका sign-in। दुकान क्या रखती है, यह ऊपर “हम जानकारी कब तक रखते हैं” में लिखा है।",
        "पूरी जानकारी: skirana.com/delete-account",
      ],
    },
    {
      heading: "बच्चे",
      body: [
        "sKirana बड़ों के लिए है। यह 18 साल से कम उम्र के किसी के लिए नहीं है, और हम जानबूझकर बच्चों की जानकारी नहीं लेते।",
      ],
    },
    {
      heading: "सुरक्षा",
      body: [
        "हम आपकी जानकारी की सुरक्षा के लिए सही इंतज़ाम रखते हैं। app और हमारे server के बीच जानकारी सुरक्षित (encrypted) तरीके से जाती है, और हर ग्राहक सिर्फ़ अपनी जानकारी तक पहुँच सकता है।",
        "दुकान के कर्मचारी सिर्फ़ उतना देखते हैं जितना आपका order तैयार करने के लिए ज़रूरी है, और वह भी सिर्फ़ दुकान के अपने network से।",
      ],
    },
    {
      heading: "संपर्क और शिकायत अधिकारी",
      body: [
        `शिकायत अधिकारी: ${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}, ${SELLER_NAME}।`,
        `फ़ोन: ${SELLER_PHONE}। email: ${CONTACT_EMAIL}। या दुकान पर आकर बताएँ।`,
        "हर शिकायत मिलने की पुष्टि हम 48 घंटे के अंदर करते हैं, और एक महीने के अंदर उसका हल करते हैं।",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Refund Policy
// ---------------------------------------------------------------------------

const refundEn: LegalDoc = {
  title: "Refund Policy",
  updated: UPDATED_EN,
  intro: "You collect every sKirana order in person, so the counter is where you check it. This policy explains what we fix on the spot, what you can bring back later, and how your money comes back to you.",
  sections: [
    {
      heading: "Check your order at the counter",
      body: [
        "Please check your order when you collect it. If there is a problem you can see, such as a wrong item, a damaged or open packet, or short weight on loose items like atta, dal, rice or sugar, tell us there and we will fix it on the spot.",
        "Claims for problems you could see at the counter are not accepted after you have left with the order.",
      ],
    },
    {
      heading: "Hidden defects in sealed packets",
      body: [
        "Some problems only show when you open a sealed, factory-packed item at home: it is past its expiry date, spoiled inside, or its inner seal is broken. This part covers only such sealed, factory-packed items.",
        `Report it within 48 hours of collecting your order. Send your order number and a photo through the chat on that order, or call us on ${SELLER_PHONE}. Then bring the packet back to the shop.`,
        "We will replace it or refund it, whichever you prefer.",
      ],
    },
    {
      heading: "Cancelled orders and items we could not supply",
      body: [
        "If an order is cancelled, whether by you, by us, or because it was not collected in time, or if we could not supply an item you paid for, we refund what you paid.",
        "The refund goes to the same UPI account you paid from within 3 working days, or in cash at the counter if you prefer.",
        "There is never a cancellation charge.",
      ],
    },
    {
      heading: "When the final bill is different",
      body: [
        "If the final bill at the counter is lower than what you paid by UPI, we return the difference.",
        "If it would be higher, we tell you before asking for more. You can then remove items or cancel the order instead, and get back everything you paid.",
      ],
    },
    {
      heading: "Not satisfied?",
      body: [
        `If you are unhappy with how we handled a replacement or refund, contact our grievance officer, ${GRIEVANCE_OFFICER}, on ${SELLER_PHONE} or at ${CONTACT_EMAIL}. Full details are in our Terms & Conditions.`,
        "This policy does not limit your rights under the Consumer Protection Act, 2019.",
      ],
    },
  ],
};

const refundHi: LegalDoc = {
  title: "रिफ़ंड नीति",
  updated: UPDATED_HI,
  intro: "sKirana का हर order आप खुद दुकान पर आकर लेते हैं, इसलिए सामान की जाँच काउंटर पर होती है। यह नीति बताती है कि हम क्या वहीं ठीक करते हैं, बाद में क्या वापस ला सकते हैं, और आपका पैसा कैसे लौटता है।",
  sections: [
    {
      heading: "काउंटर पर ही सामान जाँचें",
      body: [
        "सामान लेते समय उसे जाँच लें। अगर कोई कमी दिख रही है, जैसे ग़लत सामान, टूटा या खुला पैकेट, या खुले सामान (आटा, दाल, चावल, चीनी) में वज़न कम, तो वहीं बताएँ। हम उसी समय ठीक कर देंगे।",
        "जो कमी काउंटर पर दिख सकती थी, उसकी शिकायत सामान लेकर जाने के बाद नहीं मानी जाती।",
      ],
    },
    {
      heading: "सील बंद पैकेट में छिपी कमी",
      body: [
        "कुछ कमियाँ सील बंद, कंपनी के पैक किए सामान को घर पर खोलने पर ही पता चलती हैं: तारीख़ निकल चुकी हो, अंदर से ख़राब हो, या अंदर की सील टूटी हो। यह नियम सिर्फ़ ऐसे सील बंद, कंपनी के पैक किए सामान के लिए है।",
        `सामान लेने के 48 घंटे के अंदर बताएँ। उस order की chat में order नंबर और फ़ोटो भेजें, या ${SELLER_PHONE} पर फ़ोन करें। फिर वह पैकेट दुकान पर वापस लाएँ।`,
        "हम उसे बदल देंगे या उसका पैसा लौटा देंगे, जो आप चाहें।",
      ],
    },
    {
      heading: "रद्द order और न मिला सामान",
      body: [
        "अगर order रद्द होता है, चाहे आपने किया हो, हमने किया हो, या समय पर न लेने की वजह से हुआ हो, या आपने जिस सामान का पैसा दिया वह हम नहीं दे पाए, तो हम आपका दिया पैसा लौटाते हैं।",
        "पैसा 3 कामकाजी दिनों के अंदर उसी UPI खाते में लौटाया जाता है जिससे आपने पेमेंट किया था। चाहें तो काउंटर पर नकद ले सकते हैं।",
        "order रद्द करने का कोई चार्ज कभी नहीं लगता।",
      ],
    },
    {
      heading: "जब आख़िरी बिल अलग हो",
      body: [
        "अगर काउंटर पर आख़िरी बिल आपके UPI पेमेंट से कम बनता है, तो हम बचा हुआ पैसा लौटा देते हैं।",
        "अगर बिल ज़्यादा बनता है, तो ज़्यादा पैसा माँगने से पहले हम आपको बताएँगे। आप चाहें तो कुछ सामान हटा सकते हैं या order रद्द कर सकते हैं, और तब आपका दिया पूरा पैसा वापस मिलेगा।",
      ],
    },
    {
      heading: "संतुष्ट नहीं हैं?",
      body: [
        `अगर सामान बदलने या रिफ़ंड से आप संतुष्ट नहीं हैं, तो हमारे शिकायत अधिकारी ${GRIEVANCE_OFFICER} से ${SELLER_PHONE} पर या ${CONTACT_EMAIL} पर संपर्क करें। पूरी जानकारी नियम और शर्तें में है।`,
        "यह नीति उपभोक्ता संरक्षण अधिनियम 2019 के तहत आपके अधिकार कम नहीं करती।",
      ],
    },
  ],
};

/** All three documents, in both languages. */
export const LEGAL: LegalLibrary = {
  terms: { en: termsEn, hi: termsHi },
  privacy: { en: privacyEn, hi: privacyHi },
  refund: { en: refundEn, hi: refundHi },
};
