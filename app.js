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

const tarotWrap = document.getElementById("tarot-wrap");
const tarotImage = document.getElementById("tarot-image");

const shopGuide = document.getElementById("shop-guide");
const shopGuideTitle = shopGuide ? shopGuide.querySelector("h3") : null;
const shopGuideText = shopGuide ? shopGuide.querySelector("p") : null;
const shopGuideLink = shopGuide ? shopGuide.querySelector("a") : null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = userInput.value.trim();
  if (!input) {
    showError("入力してください。");
    return;
  }

  resetBeforeRequest();

  button.disabled = true;
  loading.classList.remove("hidden");

  try {
    const data = await postWithTimeout(WORKER_URL, { input }, 120000);

    if (!data.ok) {
      showErrorWithMeta(data);
      return;
    }

    const mode = data.mode || "unknown";

    resultMeta.textContent = buildMetaText(mode, data);
    resultMeta.classList.remove("hidden");

    resultText.textContent = data.text || "結果を受け取れませんでした。";
    resultArea.classList.remove("hidden");

    if (data.image_b64) {
      stoneImage.src = `data:image/png;base64,${data.image_b64}`;
      imageWrap.classList.remove("hidden");
    }

    if (data.tarot_image_b64) {
      tarotImage.src = `data:image/png;base64,${data.tarot_image_b64}`;
      tarotWrap.classList.remove("hidden");
    }

    updateShopGuide(mode, data.shop_url);
    showShopGuide();
  } catch (error) {
    console.error(error);
    showError("通信が止まってしまいました。少し時間をおいて、もう一度お試しください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

async function postWithTimeout(url, body, timeoutMs = 120000) {
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

function resetBeforeRequest() {
  resultEmpty.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultArea.classList.add("hidden");

  imageWrap.classList.add("hidden");
  tarotWrap.classList.add("hidden");
  hideShopGuide();

  resultText.textContent = "";

  stoneImage.removeAttribute("src");
  tarotImage.removeAttribute("src");
}

function showError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");

  resultText.textContent = message;
  resultArea.classList.remove("hidden");

  imageWrap.classList.add("hidden");
  tarotWrap.classList.add("hidden");

  stoneImage.removeAttribute("src");
  tarotImage.removeAttribute("src");

  hideShopGuide();
}

function showErrorWithMeta(data) {
  const lines = [];

  lines.push(data.error || "エラーが発生しました。");

  if (typeof data.remaining_text === "number") {
    lines.push(`残り診断回数: ${data.remaining_text}回`);
  }

  if (typeof data.remaining_tarot === "number") {
    lines.push(`残りタロット回数: ${data.remaining_tarot}回`);
  }

  if (typeof data.remaining_image === "number") {
    lines.push(`残り画像回数: ${data.remaining_image}回`);
  }

  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");

  resultText.textContent = lines.join("\n");
  resultArea.classList.remove("hidden");

  imageWrap.classList.add("hidden");
  tarotWrap.classList.add("hidden");

  stoneImage.removeAttribute("src");
  tarotImage.removeAttribute("src");

  hideShopGuide();
}

function buildMetaText(mode, data) {
  const modeText = getModeText(mode);
  const counts = [];

  if (typeof data.remaining_text === "number") {
    counts.push(`残り診断 ${data.remaining_text}回`);
  }

  if (typeof data.remaining_tarot === "number") {
    counts.push(`残りタロット ${data.remaining_tarot}回`);
  }

  if (typeof data.remaining_image === "number") {
    counts.push(`残り画像 ${data.remaining_image}回`);
  }

  if (counts.length > 0) {
    return `${modeText}｜${counts.join(" / ")}`;
  }

  return modeText;
}

function getModeText(mode) {
  switch (mode) {
    case "stone":
      return "石の名前として受け取り、辞典のように整理しました。";
    case "feeling":
      return "今の気持ちとして受け取り、対処法と合う石を整理しました。";
    case "tarot_daily":
      return "今日の運勢をタロットでやさしく読み取りました。";
    case "tarot_weekly":
      return "今週の運勢をタロットでやさしく読み取りました。";
    case "tarot_love":
      return "恋愛運をタロットでやさしく読み取りました。";
    case "tarot_general":
      return "全体運をタロットでやさしく読み取りました。";
    case "tarot_three":
      return "3枚引きで流れをやさしく読み取りました。";
    default:
      return "結果を整理しました。";
  }
}

function updateShopGuide(mode, shopUrl) {
  if (!shopGuide || !shopGuideTitle || !shopGuideText || !shopGuideLink) return;

  const url = shopUrl || "https://brgholdgs.base.shop";
  shopGuideLink.href = url;

  if (mode === "stone") {
    shopGuideTitle.textContent = "この石に近いアイテムを見てみる";
    shopGuideText.innerHTML = `
      図鑑で気になった石を、実際に手に取ってみたい方へ。<br>
      「石のつぶやき」公式ショップで関連する天然石をご覧いただけます。
    `;
    shopGuideLink.textContent = "石のつぶやき 公式ショップを見る";
    return;
  }

  if (mode === "feeling") {
    shopGuideTitle.textContent = "今回のあなたに合う石を見てみる";
    shopGuideText.innerHTML = `
      診断で気になった石を、実際に手に取ってみたい方へ。<br>
      「石のつぶやき」公式ショップで関連する天然石をご覧いただけます。
    `;
    shopGuideLink.textContent = "今回の石を見てみる";
    return;
  }

  if (mode.startsWith("tarot_")) {
    shopGuideTitle.textContent = "今の流れを支える石を見てみる";
    shopGuideText.innerHTML = `
      今回のタロット結果に寄り添う石を、実際に手に取ってみたい方へ。<br>
      「石のつぶやき」公式ショップで関連する天然石をご覧いただけます。
    `;
    shopGuideLink.textContent = "今の流れに合う石を見てみる";
    return;
  }

  shopGuideTitle.textContent = "石のつぶやき 公式ショップ";
  shopGuideText.innerHTML = `
    気になった石を、実際に手に取ってみたい方へ。<br>
    「石のつぶやき」公式ショップをご覧いただけます。
  `;
  shopGuideLink.textContent = "公式ショップを見る";
}

function showShopGuide() {
  if (!shopGuide) return;
  shopGuide.classList.remove("hidden");
}

function hideShopGuide() {
  if (!shopGuide) return;
  shopGuide.classList.add("hidden");
}
