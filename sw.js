self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Push受信
 */
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "石のつぶやきAI",
      body: "お知らせがあります"
    };
  }

  const title = data.title || "石のつぶやきAI";
  const body = data.body || "";
  const url = data.url || "/";

  const options = {
    body,
    icon: "/icon.png", // 任意（なければ削除OK）
    badge: "/icon.png",
    data: { url }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * 通知クリック
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
