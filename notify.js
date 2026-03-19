const PUSH_WORKER_URL = "https://YOUR-PUSH-WORKER.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  const enableBtn = document.getElementById("enable-notify");
  const disableBtn = document.getElementById("disable-notify");
  const testBtn = document.getElementById("send-test-notify");
  const statusEl = document.getElementById("notify-status");

  const fullMoonCheckbox = document.getElementById("notify-fullmoon");
  const intervalSelect = document.getElementById("notify-interval");
  const methodSelect = document.getElementById("notify-method");

  if (!enableBtn || !disableBtn || !testBtn || !statusEl) {
    return;
  }

  enableBtn.addEventListener("click", async () => {
    try {
      setStatus("通知を設定しています…");

      if (!("serviceWorker" in navigator)) {
        throw new Error("このブラウザは Service Worker に対応していません。");
      }

      if (!("PushManager" in window)) {
        throw new Error("このブラウザは Push 通知に対応していません。");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("通知が許可されませんでした。");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const readyRegistration = await navigator.serviceWorker.ready;

      const vapidPublicKey = await fetchVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription = await readyRegistration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      const settings = getSettings({
        fullMoonCheckbox,
        intervalSelect,
        methodSelect
      });

      await fetch(`${PUSH_WORKER_URL}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscription,
          settings
        })
      }).then(assertJsonOk);

      setStatus("通知を有効にしました。");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "通知設定に失敗しました。");
    }
  });

  disableBtn.addEventListener("click", async () => {
    try {
      setStatus("通知を解除しています…");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch(`${PUSH_WORKER_URL}/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        }).then(assertJsonOk);

        await subscription.unsubscribe();
      }

      setStatus("通知を解除しました。");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "通知解除に失敗しました。");
    }
  });

  testBtn.addEventListener("click", async () => {
    try {
      setStatus("テスト通知を送信しています…");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error("先に通知を有効にしてください。");
      }

      await fetch(`${PUSH_WORKER_URL}/send-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      }).then(assertJsonOk);

      setStatus("テスト通知を送信しました。数秒待って確認してください。");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "テスト通知の送信に失敗しました。");
    }
  });

  function setStatus(text) {
    statusEl.textContent = text;
  }
});

async function fetchVapidPublicKey() {
  const res = await fetch(`${PUSH_WORKER_URL}/vapid-public-key`);
  const data = await res.json();
  if (!data.ok || !data.publicKey) {
    throw new Error(data.error || "公開鍵の取得に失敗しました。");
  }
  return data.publicKey;
}

function getSettings({ fullMoonCheckbox, intervalSelect, methodSelect }) {
  return {
    fullMoonEnabled: !!fullMoonCheckbox?.checked,
    cleanseIntervalDays: Number(intervalSelect?.value || 7),
    favoriteCleanseMethod: String(methodSelect?.value || "cluster")
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function assertJsonOk(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}
