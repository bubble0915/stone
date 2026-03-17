const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");
const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultMeta = document.getElementById("result-meta");
const resultArea = document.getElementById("result-area");
const resultText = document.getElementById("result-text");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = userInput.value.trim();
  if (!input) {
    showError("入力してください。");
    return;
  }

  button.disabled = true;
  loading.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultArea.classList.add("hidden");
  resultText.textContent = "";

  try {
    // タイムアウトを30秒に延長して、Workerの返信を最後まで待つ
    const data = await postWithTimeout(WORKER_URL, { input }, 30000);

    if (!data.ok) {
      showError(data.error || "通信エラーが発生しました。");
      return;
    }

    resultMeta.textContent =
      data.mode === "stone"
        ? "石の名前として受け取り、辞典のように整理しました。"
        : "今の気持ちとして受け取り、対処法と合う石を整理しました。";

    resultMeta.classList.remove("hidden");
    resultText.textContent = data.text; // 全文を表示
    resultArea.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    showError("通信が途切れてしまいました。もう一度「調べる」を押してみてください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

async function postWithTimeout(url, body, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    return await response.json().catch(() => ({
      ok: false,
      error: "データの解析に失敗しました。"
    }));
  } finally {
    clearTimeout(timer);
  }
}

function showError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultText.textContent = message;
  resultArea.classList.remove("hidden");
}
