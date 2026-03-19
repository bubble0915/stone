const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

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

ensureExtraElements();

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
    const data = await postWithTimeout(WORKER_URL, { input }, 90000);

    if (!data || !data.ok) {
      showError(data?.error || "通信エラーが発生しました。");
      return;
    }

    renderMeta(data);
    renderText(data.text || "結果を受け取れませんでした。");
    renderRecommendedStones(data.recommended_stones || []);
    renderImages(data);
    renderShop(data.shop_url);
  } catch (error) {
    console.error(error);
    showError("通信が止まってしまいました。少し時間をおいて、もう一度お試しください。");
  } finally {
    setLoadingState(false);
  }
});

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

  const parts = [
    `<strong>${escapeHtml(modeLabel)}</strong>`
  ];

  if (typeof data.remaining_text === "number") {
    parts.push(`無料診断残り: ${data.remaining_text}回`);
  }

  if (typeof data.remaining_tarot === "number") {
    parts.push(`無料タロット残り: ${data.remaining_tarot}回`);
  }

  if (typeof data.remaining_stone_image === "number") {
    parts.push(`石画像残り: ${data.remaining_stone_image}回`);
  }

  if (typeof data.remaining_tarot_image === "number") {
    parts.push(`タロット画像残り: ${data.remaining_tarot_image}回`);
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
