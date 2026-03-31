const WORKER_URL = "https://stone-01.its-brg77.workers.dev";
const BILLING_URL = "https://stone-billing.its-brg77.workers.dev";

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

const USER_ID_STORAGE_KEY = "stone_user_id";
const PLAN_STORAGE_KEY = "stone_user_plan";

const currentPlanLabel = document.getElementById("current-plan-label");
const currentPlanDesc = document.getElementById("current-plan-desc");
const planLimitGuide = document.getElementById("plan-limit-guide");
const upgradeButton = document.getElementById("upgrade-button");
const planButtons = document.querySelectorAll(".plan-btn");

ensureExtraElements();
ensureUserId();

window.addEventListener("DOMContentLoaded", async () => {
  await syncPlanFromServer();
  renderPlanUi();
});

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
    await syncPlanFromServer();

    const currentPlan = getCurrentPlan();
    const userId = getOrCreateUserId();

    const data = await postWithTimeout(
      WORKER_URL,
      {
        input,
        user_id: userId,
        plan: currentPlan
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

    if (data.plan) {
      setCurrentPlan(data.plan);
      renderPlanUi();
    }
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
    alert(getUpgradeMessage(getCurrentPlan()));
  });
}

async function subscribe(plan) {
  const normalizedPlan = normalizePlan(plan);

  if (normalizedPlan === "free") {
    setCurrentPlan("free");
    renderPlanUi();
    alert("無料プランです。");
    return;
  }

  const userId = getOrCreateUserId();

  try {
    const successUrl = new URL(window.location.href);
    successUrl.searchParams.set("payment", "success");

    const cancelUrl = new URL(window.location.href);
    cancelUrl.searchParams.set("payment", "cancel");

    const response = await fetch(`${BILLING_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan: normalizedPlan,
        userId,
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

async function syncPlanFromServer() {
  const userId = getOrCreateUserId();

  try {
    const response = await fetch(`${BILLING_URL}/subscription-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });

    const data = await response.json().catch(() => ({}));
    if (data?.ok && data.plan) {
      setCurrentPlan(data.plan);
    }

    handlePaymentNotice();
  } catch (error) {
    console.error("subscription-status error:", error);
  }
}

function handlePaymentNotice() {
  const url = new URL(window.location.href);
  const payment = url.searchParams.get("payment");

  if (payment === "success") {
    alert("決済が完了しました。プラン状態を確認しました。");
    url.searchParams.delete("payment");
    window.history.replaceState({}, "", url.toString());
  }

  if (payment === "cancel") {
    alert("決済はキャンセルされました。");
    url.searchParams.delete("payment");
    window.history.replaceState({}, "", url.toString());
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
    case "stone": return "石辞典モード";
    case "feeling": return "気持ち診断モード";
    case "tarot_daily": return "タロット：今日の運勢";
    case "tarot_weekly": return "タロット：今週の運勢";
    case "tarot_love": return "タロット：恋愛運";
    case "tarot_general": return "タロット：全体運";
    case "tarot_three": return "タロット：3枚引き";
    default: return "結果";
  }
}

function getPlanLabel(plan) {
  switch (normalizePlan(plan)) {
    case "light_1980": return "ライト 1980円/月";
    case "standard_3580": return "スタンダード 3580円/月";
    case "premium_9800": return "プレミアム 9800円/月";
    case "pro_15800": return "プロ 15800円/月";
    case "free":
    default:
      return "お試し 無料プラン";
  }
}

function getPlanDescription(plan) {
  switch (normalizePlan(plan)) {
    case "light_1980": return "個人利用向けの使いやすいプランです。";
    case "standard_3580": return "本格利用・ヘビーユーザー向けの拡張プランです。";
    case "premium_9800": return "個人占い師・個人ショップ向けの上位プランです。";
    case "pro_15800": return "業者・法人向けの最上位プランです。";
    case "free":
    default:
      return "まずは無料でお試しいただけます。";
  }
}

function getPlanLimitText(plan) {
  switch (normalizePlan(plan)) {
    case "light_1980":
      return "ライト：個人利用向け / 無料プランより多く利用可能";
    case "standard_3580":
      return "スタンダード：本格利用・ヘビーユーザー向け / 診断・画像生成・占い利用をさらに拡張";
    case "premium_9800":
      return "プレミアム：個人占い師・個人ショップ向け / 高頻度利用向け";
    case "pro_15800":
      return "プロ：業者・法人向け / 全機能向け・業務利用向け";
    case "free":
    default:
      return "お試し：診断3回 / タロット3回 / 石画像1回 / タロット画像1回";
  }
}

function getUpgradeMessage(plan) {
  switch (normalizePlan(plan)) {
    case "free":
      return [
        "現在はお試し 無料プランです。",
        "",
        "ご利用いただけるプラン",
        "・ライト 1980円/月：個人利用向け",
        "・スタンダード 3580円/月：本格利用・ヘビーユーザー向け",
        "・プレミアム 9800円/月：個人占い師・個人ショップ向け",
        "・プロ 15800円/月：業者・法人向け",
        "",
        "ご希望のプランボタンからお進みください。"
      ].join("\n");
    case "light_1980":
      return [
        "現在はライト 1980円/月プランです。",
        "",
        "さらにご利用を広げたい場合は、",
        "・スタンダード 3580円/月",
        "・プレミアム 9800円/月",
        "・プロ 15800円/月",
        "をご検討ください。"
      ].join("\n");
    case "standard_3580":
      return [
        "現在はスタンダード 3580円/月プランです。",
        "",
        "さらに上位のご利用をご希望の場合は、",
        "・プレミアム 9800円/月",
        "・プロ 15800円/月",
        "をご検討ください。"
      ].join("\n");
    case "premium_9800":
      return [
        "現在はプレミアム 9800円/月プランです。",
        "",
        "業務利用・法人利用をご希望の場合は、",
        "・プロ 15800円/月",
        "がおすすめです。"
      ].join("\n");
    case "pro_15800":
      return [
        "現在はプロ 15800円/月プランです。",
        "",
        "このプランは最上位プランです。"
      ].join("\n");
    default:
      return "プラン案内を表示できませんでした。";
  }
}

function renderPlanUi() {
  const plan = getCurrentPlan();

  if (currentPlanLabel) currentPlanLabel.textContent = getPlanLabel(plan);
  if (currentPlanDesc) currentPlanDesc.textContent = getPlanDescription(plan);
  if (planLimitGuide) planLimitGuide.textContent = getPlanLimitText(plan);

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

  if (["free", "無料", "お試し"].includes(value)) return "free";

  if ([
    "light",
    "light_1980",
    "1980",
    "1980円",
    "standard",
    "standard_980",
    "980",
    "980円"
  ].includes(value)) {
    return "light_1980";
  }

  if ([
    "standard_3580",
    "3580",
    "3580円",
    "premium",
    "premium_2980",
    "2980",
    "2980円"
  ].includes(value)) {
    return "standard_3580";
  }

  if ([
    "premium_9800",
    "9800",
    "9800円",
    "professional",
    "professional_9800",
    "professional9800"
  ].includes(value)) {
    return "premium_9800";
  }

  if ([
    "pro",
    "pro_15800",
    "15800",
    "15800円"
  ].includes(value)) {
    return "pro_15800";
  }

  return "free";
}

function getCurrentPlan() {
  return normalizePlan(localStorage.getItem(PLAN_STORAGE_KEY) || "free");
}

function setCurrentPlan(plan) {
  const normalized = normalizePlan(plan);
  localStorage.setItem(PLAN_STORAGE_KEY, normalized);
  return normalized;
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
