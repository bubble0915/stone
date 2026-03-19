const PUSH_WORKER_URL = "https://stone-push-test.its-brg77.workers.dev";
const PUBLIC_VAPID_KEY = "BFfcC7aBaP0zxK6HtOUdiq6wW0jgAtsWJFleGclsliDEi3nwwFmD8n9pLzpcuFfguTpUvFzFNu41LIGKh7gnpNc";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function registerServiceWorker() {
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

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("このブラウザは通知に対応していません。");
    return false;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("通知が許可されませんでした。");
    return false;
  }

  return true;
}

async function subscribeUserToPush() {
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

    console.log("Push購読成功:", subscription);
    return subscription;
  } catch (error) {
    console.error("Push購読失敗:", error);
    alert("Push通知の購読に失敗しました。");
    return null;
  }
}

async function saveSubscriptionToServer(subscription) {
  try {
    const response = await fetch(`${PUSH_WORKER_URL}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    const data = await response.json();
    console.log("保存レスポンス:", data);

    if (!response.ok) {
      throw new Error(data.error || "購読情報の保存に失敗しました");
    }

    return true;
  } catch (error) {
    console.error("購読保存失敗:", error);
    alert("購読情報の保存に失敗しました。");
    return false;
  }
}

async function enablePush() {
  const swReg = await registerServiceWorker();
  if (!swReg) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const subscription = await subscribeUserToPush();
  if (!subscription) return;

  const saved = await saveSubscriptionToServer(subscription);
  if (!saved) return;

  alert("通知登録が完了しました。");
}

window.enablePush = enablePush;
