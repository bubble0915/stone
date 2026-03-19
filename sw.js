self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "石のつぶやきAI",
    body: "お知らせがあります。",
    url: "/"
  };

  try {
    const parsed = event.data?.json();
    if (parsed && typeof parsed === "object") {
      data = {
        ...data,
        ...parsed
      };
    }
  } catch (_) {}

  const options = {
    body: data.body || "",
    icon: "/icon.png",
    badge: "/icon.png",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "石のつぶやきAI", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
