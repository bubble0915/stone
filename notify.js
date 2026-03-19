const PUSH_WORKER_URL = "https://stone-push-worker.its-brg77.workers.dev";

// ★ここにあなたのPublic Keyを入れる
const VAPID_PUBLIC_KEY = "ここにPublicKey";

async function registerPush() {
  if (!("serviceWorker" in navigator)) {
    alert("このブラウザは通知に対応していません");
    return;
  }

  if (!("PushManager" in window)) {
    alert("Push通知に対応していません");
    return;
  }

  try {
    // Service Worker登録
    const registration = await navigator.serviceWorker.register("/sw.js");

    // 通知許可
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("通知が拒否されました");
      return;
    }

    // 購読作成
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Workerへ送信
    await fetch(`${PUSH_WORKER_URL}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subscription,
        settings: {
          fullMoonEnabled: true,
          cleanseIntervalDays: 7,
          favoriteCleanseMethod: "cluster"
        }
      })
    });

    alert("通知登録が完了しました✨");
  } catch (err) {
    console.error(err);
    alert("通知登録に失敗しました");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ボタン用
window.enablePush = registerPush;
