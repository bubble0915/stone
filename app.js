const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");
const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultMeta = document.getElementById("result-meta");
const resultBox = document.getElementById("result-box");
const fullResult = document.getElementById("full-result");

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
  resultBox.classList.add("hidden");
  fullResult.textContent = "";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    if (!data.ok) {
      showError(data.error || "通信エラーが発生しました。");
      return;
    }

    resultMeta.textContent =
      data.mode === "stone"
        ? "石の名前として受け取り、辞典のように整理しました。"
        : "今の気持ちとして受け取り、対処法と合う石を整理しました。";

    resultMeta.classList.remove("hidden");

    /* 一切加工せず、返ってきた本文を全部そのまま表示 */
    fullResult.textContent = data.text;

    resultBox.classList.remove("hidden");
  } catch (error) {
    showError("ごめんなさい。今は少し通信が不安定なようです。少し時間をおいて、もう一度お試しください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function showError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  fullResult.textContent = message;
  resultBox.classList.remove("hidden");
}
