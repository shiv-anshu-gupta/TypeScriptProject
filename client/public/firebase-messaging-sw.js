/* global importScripts, firebase, clients */
// Firebase Cloud Messaging background handler for the admin app.
// The public config is passed in the registration URL's query string (see
// src/lib/firebase.ts), so it never has to be duplicated/edited here.
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

const params = new URLSearchParams(self.location.search);
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "New order";
    const body = (payload.notification && payload.notification.body) || "";
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.data || {},
      tag: "skirana-order", // collapse duplicates
      renotify: true,
    });
  });
}

// Focus/open the orders page when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) return client.focus();
      }
      return clients.openWindow("/admin/grocery-lists");
    }),
  );
});
