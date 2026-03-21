const WORKER_URL = "https://stone-01.its-brg77.workers.dev";
const BILLING_URL = "https://stone-billing.its-brg77.workers.dev";

const PRICE_IDS = {
  standard_980: "price_1TDGdCGZvoTS1v1DlAkALz14",
  premium_2980: "price_1TDGfEGZvoTS1v1DM4XCVhU1",
  professional_9800: "price_1TDGgoGZvoTS1v1DMsrPGtdk"
};

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");
const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultMeta = document.getElementById("result-meta");
const resultArea = document.getElementById("result-area");
const resultText = document.getElementById("result-text");
const imageWrap = document.getElementById("image-wrap");
const stoneImage = document.getElementById("stone-image");

let tarotImageWrap = document.getElementById("tarot-image-wrap");
let tarotImage = document.getElementById("tarot-image");
let recommendedWrap = document.getElementById("recommended-wrap");
let recommendedList = document.getElementById("recommended-list");
let shopWrap = document.getElementById("shop-wrap");
let shopLink = document.getElementById("shop-link");

const PLAN_STORAGE_KEY = "stone_user_plan";
const USER_ID_STORAGE_KEY = "stone_user_id";

const currentPlanLabel = document.getElementById("current-plan-label");
const currentPlanDesc = document.getElementById("current-plan-desc");
const planLimitGuide = document.getElementById("plan-limit-guide");
const upgradeButton = document.getElementById("upgrade-button");
const planButtons = document.querySelectorAll(".plan-btn");

ensureExtraElements();
ensureUserId();
syncPlanFromUrl();
syncPlanFromPaymentResult();
renderPlanUi();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = userInput.value.trim();
  if (!input) {
    showError("入力してください。");
    return;
  }

  setLoadingState(true);
  resetView();

  try {
    const currentPlan = getCurrentPlan();
    const userId = getOrCreateUserId();

    const data = await postWithTimeout(
      WORKER_URL,
      {
        input,
        plan: currentPlan,
        user_id: userId
      },
      90000
    );

    if (!data || !data.ok) {
      showError(data?.error || "通信エラーが発生しました。");
      return;
    }

    renderMeta(data);
    renderText(data.text || "結果を受け取れませんでした。");
    renderRecommendedStones(data.recommended_stones || []);
    renderImages(data);
    renderShop(data.shop_url);
    renderPlanUi();
  } catch (error) {
    console.error(error);
    showError("通信が止まってしまいました。少し時間をおいて、もう一度お試しください。");
  } finally {
    setLoadingState(false);
  }
});

planButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.getAttribute("data-plan") || "free";
    await subscribe(plan);
  });
});

if (upgradeButton) {
  upgradeButton.addEventListener("click", () => {
    const currentPlan = getCurrentPlan();
    alert(getUpgradeMessage(currentPlan));
  });
}

async function subscribe(plan) {
  const normalizedPlan = normalizePlan(plan);

  if (normalizedPlan === "free") {
    setCurrentPlan("free");
    renderPlanUi();
    alert("無料プランに切り替えました。");
    return;
  }

  const priceId = PRICE_IDS[normalizedPlan];
  if (!priceId) {
    alert("このプランはまだ準備中です。");
    return;
  }

  try {
    const successUrl = new URL(window.location.href);
    successUrl.searchParams.set("payment", "success");
    successUrl.searchParams.set("plan", normalizedPlan);

    const cancelUrl = new URL(window.location.href);
    cancelUrl.searchParams.set("payment", "cancel");

    const response = await fetch(`${BILLING_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        priceId,
        successUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString()
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.ok || !data?.url) {
      alert(data?.error || "決済ページの作成に失敗しました。");
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert("決済ページへの接続に失敗しました。");
  }
}

async function postWithTimeout(url, body, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    return await response.json().catch(() => ({
      ok: false,
      error: "JSONの読み取りに失敗しました。"
    }));
  } finally {
    clearTimeout(timer);
  }
}

function setLoadingState(isLoading) {
  button.disabled = isLoading;
  if (isLoading) {
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

function resetView() {
  resultEmpty.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultArea.classList.add("hidden");
  imageWrap.classList.add("hidden");
  tarotImageWrap.classList.add("hidden");
  recommendedWrap.classList.add("hidden");
  shopWrap.classList.add("hidden");

  resultMeta.innerHTML = "";
  resultText.textContent = "";
  recommendedList.innerHTML = "";

  stoneImage.removeAttribute("src");
  tarotImage.removeAttribute("src");
  shopLink.removeAttribute("href");
  shopLink.textContent = "";
}

function renderMeta(data) {
  const modeLabel = getModeLabel(data.mode);
  const planLabel = getPlanLabel(data.plan);

  const parts = [
    `<strong>${escapeHtml(modeLabel)}</strong>`,
    `プラン: ${escapeHtml(planLabel)}`
  ];

  if (typeof data.remaining_text === "number") {
    parts.push(`診断残り: ${data.remaining_text}回`);
  } else if (data.remaining_text === null) {
    parts.push("診断残り: 無制限");
  }

  if (typeof data.remaining_tarot === "number") {
    parts.push(`タロット残り: ${data.remaining_tarot}回`);
  } else if (data.remaining_tarot === null) {
    parts.push("タロット残り: 無制限");
  }

  if (typeof data.remaining_stone_image === "number") {
    parts.push(`石画像残り: ${data.remaining_stone_image}回`);
  } else if (data.remaining_stone_image === null) {
    parts.push("石画像残り: 無制限");
  }

  if (typeof data.remaining_tarot_image === "number") {
    parts.push(`タロット画像残り: ${data.remaining_tarot_image}回`);
  } else if (data.remaining_tarot_image === null) {
    parts.push("タロット画像残り: 無制限");
  }

  if (data.image_error) {
    parts.push(`画像: ${escapeHtml(data.image_error)}`);
  }

  resultMeta.innerHTML = parts.join("<br>");
  resultMeta.classList.remove("hidden");
}

function renderText(text) {
  resultText.textContent = text;
  resultArea.classList.remove("hidden");
}

function renderRecommendedStones(stones) {
  if (!Array.isArray(stones) || stones.length === 0) {
    return;
  }

  recommendedList.innerHTML = "";

  stones.forEach((stone, index) => {
    const item = document.createElement("div");
    item.className = "recommended-item";

    const title = document.createElement("div");
    title.className = "recommended-name";
    title.textContent = `${index + 1}. ${stone.name || "石"}`;

    const meta = document.createElement("div");
    meta.className = "recommended-tags";

    const tags = Array.isArray(stone.tags) ? stone.tags.join("・") : "";
    const colors = Array.isArray(stone.color) ? stone.color.join("・") : "";

    meta.textContent = [colors, tags].filter(Boolean).join(" / ");

    item.appendChild(title);
    item.appendChild(meta);
    recommendedList.appendChild(item);
  });

  recommendedWrap.classList.remove("hidden");
}

function renderImages(data) {
  if (data.image_b64) {
    stoneImage.src = `data:image/png;base64,${data.image_b64}`;
    imageWrap.classList.remove("hidden");
  }

  if (data.tarot_image_b64) {
    tarotImage.src = `data:image/png;base64,${data.tarot_image_b64}`;
    tarotImageWrap.classList.remove("hidden");
  }
}

function renderShop(url) {
  if (!url) return;

  shopLink.href = url;
  shopLink.textContent = "石のつぶやきショップを見る";
  shopLink.target = "_blank";
  shopLink.rel = "noopener noreferrer";
  shopWrap.classList.remove("hidden");
}

function showError(message) {
  resultMeta.innerHTML = "<strong>お知らせ</strong>";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultText.textContent = message;
  resultArea.classList.remove("hidden");
  imageWrap.classList.add("hidden");
  tarotImageWrap.classList.add("hidden");
  recommendedWrap.classList.add("hidden");
  shopWrap.classList.add("hidden");
}

function getModeLabel(mode) {
  switch (mode) {
    case "stone":
      return "石辞典モード";
    case "feeling":
      return "気持ち診断モード";
    case "tarot_daily":
      return "タロット：今日の運勢";
    case "tarot_weekly":
      return "タロット：今週の運勢";
    case "tarot_love":
      return "タロット：恋愛運";
    case "tarot_general":
      return "タロット：全体運";
    case "tarot_three":
      return "タロット：3枚引き";
    default:
      return "結果";
  }
}

function getPlanLabel(plan) {
  switch (normalizePlan(plan)) {
    case "standard_980":
      return "スタンダード 980円";
    case "premium_2980":
      return "プレミアム 2980円";
    case "professional_9800":
      return "プロフェッショナル 9800円";
    case "free":
    default:
      return "無料プラン";
  }
}

function getPlanDescription(plan) {
  switch (normalizePlan(plan)) {
    case "standard_980":
      return "毎日しっかり使いたい方向けの基本プランです。";
    case "premium_2980":
      return "たくさん使いたい方向けの上位プランです。";
    case "professional_9800":
      return "占い師さん・ショップ運用を想定した業務向けプランです。";
    case "free":
    default:
      return "まずは無料でお試しいただけます。";
  }
}

function getPlanLimitText(plan) {
  switch (normalizePlan(plan)) {
    case "standard_980":
      return "980円プラン：診断20回 / タロット20回 / 石画像5回 / タロット画像5回";
    case "premium_2980":
      return "2980円プラン：診断100回 / タロット100回 / 石画像20回 / タロット画像20回";
    case "professional_9800":
      return "9800円プラン：実質無制限 / 業務利用向け";
    case "free":
    default:
      return "無料プラン：診断3回 / タロット3回 / 石画像1回 / タロット画像1回";
  }
}

function getUpgradeMessage(plan) {
  switch (normalizePlan(plan)) {
    case "free":
      return [
        "現在は無料プランです。",
        "",
        "・980円プラン：日常使い向け",
        "・2980円プラン：ヘビーユーザー向け",
        "・9800円プラン：占い師さん・ショップ向け",
        "",
        "有料プランはStripe決済ページへ進みます。"
      ].join("\n");
    case "standard_980":
      return [
        "現在は980円プランです。",
        "",
        "さらに使いたい場合は",
        "・2980円プラン",
        "・9800円プロフェッショナルプラン",
        "をご検討ください。"
      ].join("\n");
    case "premium_2980":
      return [
        "現在は2980円プランです。",
        "",
        "業務向けで使う場合は",
        "・9800円プロフェッショナルプラン",
        "がおすすめです。"
      ].join("\n");
    case "professional_9800":
      return [
        "現在はプロフェッショナルプランです。",
        "",
        "このプランは最上位プランです。"
      ].join("\n");
    default:
      return "プラン案内を表示できませんでした。";
  }
}

function renderPlanUi() {
  const plan = getCurrentPlan();

  if (currentPlanLabel) {
    currentPlanLabel.textContent = getPlanLabel(plan);
  }

  if (currentPlanDesc) {
    currentPlanDesc.textContent = getPlanDescription(plan);
  }

  if (planLimitGuide) {
    planLimitGuide.textContent = getPlanLimitText(plan);
  }

  planButtons.forEach((btn) => {
    const btnPlan = btn.getAttribute("data-plan") || "free";
    btn.classList.toggle("active", normalizePlan(btnPlan) === plan);
  });
}

function ensureExtraElements() {
  const resultCard = document.querySelector(".result-card");

  if (!tarotImageWrap) {
    tarotImageWrap = document.createElement("div");
    tarotImageWrap.id = "tarot-image-wrap";
    tarotImageWrap.className = "image-wrap hidden";

    tarotImage = document.createElement("img");
    tarotImage.id = "tarot-image";
    tarotImage.alt = "タロット画像";

    tarotImageWrap.appendChild(tarotImage);
    resultCard.appendChild(tarotImageWrap);
  }

  if (!recommendedWrap) {
    recommendedWrap = document.createElement("div");
    recommendedWrap.id = "recommended-wrap";
    recommendedWrap.className = "recommended-wrap hidden";

    const title = document.createElement("h3");
    title.textContent = "おすすめの石";

    recommendedList = document.createElement("div");
    recommendedList.id = "recommended-list";
    recommendedList.className = "recommended-list";

    recommendedWrap.appendChild(title);
    recommendedWrap.appendChild(recommendedList);
    resultCard.appendChild(recommendedWrap);
  }

  if (!shopWrap) {
    shopWrap = document.createElement("div");
    shopWrap.id = "shop-wrap";
    shopWrap.className = "shop-wrap hidden";

    const title = document.createElement("div");
    title.className = "shop-title";
    title.textContent = "気になる石があればこちら";

    shopLink = document.createElement("a");
    shopLink.id = "shop-link";
    shopLink.className = "shop-link";

    shopWrap.appendChild(title);
    shopWrap.appendChild(shopLink);
    resultCard.appendChild(shopWrap);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizePlan(rawPlan) {
  const value = String(rawPlan || "free").trim().toLowerCase();

  if (["free", "無料"].includes(value)) return "free";
  if (["standard", "standard_980", "980", "980円"].includes(value)) return "standard_980";
  if (["premium", "premium_2980", "2980", "2980円"].includes(value)) return "premium_2980";
  if (["professional", "professional_9800", "pro", "9800", "9800円", "professional9800"].includes(value)) {
    return "professional_9800";
  }

  return "free";
}

function getCurrentPlan() {
  const stored = localStorage.getItem(PLAN_STORAGE_KEY);
  return normalizePlan(stored || "free");
}

function setCurrentPlan(plan) {
  const normalized = normalizePlan(plan);
  localStorage.setItem(PLAN_STORAGE_KEY, normalized);
  return normalized;
}

function syncPlanFromUrl() {
  const url = new URL(window.location.href);
  const urlPlan = url.searchParams.get("plan");

  if (!urlPlan) return;

  setCurrentPlan(urlPlan);
}

function syncPlanFromPaymentResult() {
  const url = new URL(window.location.href);
  const payment = url.searchParams.get("payment");
  const plan = url.searchParams.get("plan");

  if (payment === "success" && plan) {
    setCurrentPlan(plan);
    alert(`決済が完了しました。現在のプランは「${getPlanLabel(plan)}」です。`);
    url.searchParams.delete("payment");
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", url.toString());
    return;
  }

  if (payment === "cancel") {
    alert("決済はキャンセルされました。");
    url.searchParams.delete("payment");
    window.history.replaceState({}, "", url.toString());
  }
}

function ensureUserId() {
  getOrCreateUserId();
}

function getOrCreateUserId() {
  let userId = localStorage.getItem(USER_ID_STORAGE_KEY);

  if (!userId) {
    userId = createSimpleUserId();
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }

  return userId;
}

function createSimpleUserId() {
  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);
  return `stone_${timePart}_${randomPart}`;
}

window.stoneApp = window.stoneApp || {};
window.stoneApp.getCurrentPlan = getCurrentPlan;
window.stoneApp.setCurrentPlan = (plan) => {
  const normalized = setCurrentPlan(plan);
  renderPlanUi();
  return normalized;
};
window.stoneApp.getUserId = getOrCreateUserId;
window.stoneApp.subscribe = subscribe;
