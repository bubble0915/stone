const PUSH_WORKER_URL = "https://stone-push-worker.its-brg77.workers.dev";

/**
 * Cloudflare Workerに設定した公開VAPIDキーを入れてください
 * 例:
 * const PUBLIC_VAPID_KEY = "BEXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
 */
const PUBLIC_VAPID_KEY = "ここに公開VAPIDキーを入れる";

/**
 * Base64URL → Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Service Worker登録
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    alert("このブラウザはService Workerに対応していません。");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    console.log("Service Worker 登録成功:", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker 登録失敗:", error);
    alert("Service Workerの登録に失敗しました。");
    return null;
  }
}

/**
 * 通知許可を取得
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("このブラウザは通知に対応していません。");
    return false;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("通知が許可されませんでした。ブラウザ設定から許可してください。");
    return false;
  }

  return true;
}

/**
 * Push購読を取得または新規作成
 */
export async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    console.log("既存の購読あり:", subscription);
    return subscription;
  }

  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    console.log("新規購読成功:", subscription);
    return subscription;
  } catch (error) {
    console.error("Push購読失敗:", error);
    alert("Push通知の購読に失敗しました。");
    return null;
  }
}

/**
 * Workerへ購読情報を送信して保存
 */
export async function saveSubscriptionToServer(subscription) {
  try {
    const response = await fetch(`${PUSH_WORKER_URL}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    const data = await response.json();
    console.log("購読保存レスポンス:", data);

    if (!response.ok) {
      throw new Error(data.error || "購読保存に失敗しました");
    }

    return true;
  } catch (error) {
    console.error("購読保存失敗:", error);
    alert("購読情報の保存に失敗しました。");
    return false;
  }
}

/**
 * 通知登録を全部まとめて実行
 */
export async function enablePushNotifications() {
  const swReg = await registerServiceWorker();
  if (!swReg) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const subscription = await subscribeUserToPush();
  if (!subscription) return false;

  const saved = await saveSubscriptionToServer(subscription);
  if (!saved) return false;

  alert("通知登録が完了しました。");
  return true;
}

/**
 * テスト通知送信
 */
export async function sendTestNotification() {
  try {
    const response = await fetch(`${PUSH_WORKER_URL}/send-test`, {
      method: "POST",
    });

    const data = await response.json();
    console.log("テスト通知レスポンス:", data);

    if (!response.ok) {
      throw new Error(data.error || "テスト通知送信に失敗しました");
    }

    alert("テスト通知を送信しました。");
    return true;
  } catch (error) {
    console.error("テスト通知送信失敗:", error);
    alert("テスト通知の送信に失敗しました。");
    return false;
  }
}
