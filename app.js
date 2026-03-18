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

// 追加：ショップ導線
const shopGuide = document.getElementById("shop-guide");
const shopGuideTitle = shopGuide ? shopGuide.querySelector("h3") : null;
const shopGuideText = shopGuide ? shopGuide.querySelector("p") : null;

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
    const data = await postWithTimeout(WORKER_URL, { input }, 60000);

    if (!data.ok) {
      showError(data.error || "通信エラーが発生しました。");
      return;
    }

    const mode = data.mode === "stone" ? "stone" : "feeling";

    resultMeta.textContent =
      mode === "stone"
        ? "石の名前として受け取り、辞典のように整理しました。"
        : "今の気持ちとして受け取り、対処法と合う石を整理しました。";

    resultMeta.classList.remove("hidden");
    resultText.textContent = data.text || "結果を受け取れませんでした。";
    resultArea.classList.remove("hidden");

    if (data.image_b64) {
      stoneImage.src = `data:image/png;base64,${data.image_b64}`;
      imageWrap.classList.remove("hidden");
    }

    updateShopGuide(mode);
    showShopGuide();
  } catch (error) {
    console.error(error);
    showError("通信が止まってしまいました。少し時間をおいて、もう一度お試しください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

async function postWithTimeout(url, body, timeoutMs = 60000) {
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
  hideShopGuide();

  resultText.textContent = "";
  stoneImage.removeAttribute("src");
}

function showError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultText.textContent = message;
  resultArea.classList.remove("hidden");
  imageWrap.classList.add("hidden");
  stoneImage.removeAttribute("src");
  hideShopGuide();
}

function updateShopGuide(mode) {
  if (!shopGuide || !shopGuideTitle || !shopGuideText) return;

  if (mode === "stone") {
    shopGuideTitle.textContent = "この石に近いアイテムを見てみる";
    shopGuideText.innerHTML = `
      図鑑で気になった石を、実際に手に取ってみたい方へ。<br>
      「石のつぶやき」公式ショップで関連する天然石をご覧いただけます。
    `;
  } else {
    shopGuideTitle.textContent = "今回のあなたに合う石を見てみる";
    shopGuideText.innerHTML = `
      診断で気になった石を、実際に手に取ってみたい方へ。<br>
      「石のつぶやき」公式ショップで関連する天然石をご覧いただけます。
    `;
  }
}

function showShopGuide() {
  if (!shopGuide) return;
  shopGuide.classList.remove("hidden");
}

function hideShopGuide() {
  if (!shopGuide) return;
  shopGuide.classList.add("hidden");
}
