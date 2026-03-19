self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push event received");

  let data = {
    title: "石のつぶやきAI",
    body: "新しいお知らせがあります。",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    url: "/"
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = {
        ...data,
        ...json
      };
    } catch (e) {
      console.error("Push JSON parse error:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
