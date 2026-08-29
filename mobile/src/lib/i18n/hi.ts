import type { Translations } from "./en";

// Hindi strings — simple, everyday Hindi for non-English-speaking customers.
// Keys must match en.ts exactly.
export const hi: Translations = {
  lang: {
    welcome: "स्वागत है",
    choosePrompt: "अपनी भाषा चुनें",
    hindi: "हिंदी",
    english: "English",
    continue: "आगे बढ़ें",
    changeLater: "इसे आप कभी भी Account में बदल सकते हैं।",
  },
  common: {
    save: "सेव करें",
    cancel: "रद्द करें",
    close: "बंद करें",
    delete: "हटाएँ",
    remove: "हटाएँ",
    later: "बाद में",
    signIn: "साइन इन करें",
    updateNow: "अभी अपडेट करें",
    language: "भाषा",
  },
  tabs: {
    home: "होम",
    shop: "दुकान",
    lists: "लिस्ट",
    account: "अकाउंट",
  },
  home: {
    tagline: "आपकी अपनी दुकान, आपके फ़ोन पर",
    browse: "श्रेणी से चुनें",
    newArrivals: "नए आइटम",
    viewAll: "सभी देखें",
    item: "आइटम",
    qty: "मात्रा",
    sendList: "दुकान को लिस्ट भेजें",
    sendItems_one: "{{count}} आइटम दुकान को भेजें",
    sendItems_other: "{{count}} आइटम दुकान को भेजें",
    priceNote: "दुकान आपकी लिस्ट का दाम लगाकर वापस भेजेगी",
  },
  phone: {
    title: "अपना मोबाइल नंबर डालें",
    placeholder: "10 अंकों का नंबर",
    invalid: "सही 10 अंकों का नंबर डालें",
    trust:
      "यह नंबर हम सिर्फ़ ज़रूरत पड़ने पर आपके ऑर्डर के बारे में कॉल करने के लिए लेंगे।",
    save: "सेव करके लिस्ट भेजें",
  },
  lists: {
    title: "मेरी लिस्ट",
    listNo: "लिस्ट #{{code}}",
    itemsCount_one: "{{count}} आइटम",
    itemsCount_other: "{{count}} आइटम",
    newUpdate: "नया अपडेट",
    waiting: "दुकान द्वारा दाम लगाने का इंतज़ार है।",
    busy:
      "दुकान अभी थोड़ी व्यस्त है — आपकी लिस्ट मिल गई है, हम जल्द ही दाम भेज देंगे।",
    total: "कुल",
    estimate: "अनुमानित कुल — आपका असली बिल दुकान पर बनेगा।",
    paymentReceived: "पेमेंट मिल गया",
    payUpi: "UPI से {{amount}} भेजें",
    payAtShop: "दुकान पर भुगतान करें",
    payNote: "भुगतान के बाद, पैसे आने पर दुकान पुष्टि करेगी।",
    messageShop: "दुकान को मैसेज करें",
    removeTitle: "आइटम हटाएँ",
    removeConfirm: '"{{name}}" को इस लिस्ट से हटाएँ?',
    cancelled: "रद्द किया गया",
    emptySignedOut: "दुकान को भेजी गई लिस्ट देखने के लिए साइन इन करें।",
    emptyNoLists:
      "आपने अभी तक कोई लिस्ट नहीं भेजी। होम पेज पर एक लिस्ट लिखें।",
    goHome: "होम पर जाएँ",
    newListLabel: "आपकी नई लिस्ट",
    notSent: "अभी भेजी नहीं",
    addMore: "दुकान टैब से और जोड़ें, या होम पेज पर बदलें।",
    timeline: {
      received: "लिस्ट मिल गई",
      priced: "दुकान ने दाम लगाया",
      packing: "पैकिंग हो रही है",
      packed: "पैक हो गया",
      ready: "लेने के लिए आएँ",
    },
  },
  update: {
    title: "नया अपडेट तैयार है ✨",
    body: "ऐप का नया वर्शन आ गया है — नया पाने के लिए अभी अपडेट करें।",
  },
};
