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
  if (!input) return;

  button.disabled = true;
  loading.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultArea.classList.add("hidden");
  resultText.textContent = "";

  try {
    // 待機時間を40秒に延長（Geminiが長文を書くのを最後まで待つ）
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (!data.ok) {
      showError(data.error || "通信エラーが発生しました。");
      return;
    }

    resultMeta.textContent = data.mode === "stone" ? "【石の辞典】" : "【心の提案】";
    resultMeta.classList.remove("hidden");
    resultText.textContent = data.text;
    resultArea.classList.remove("hidden");
  } catch (error) {
    showError("通信が途切れました。AIが長考しているかもしれません。もう一度「調べる」を押してみてください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function showError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultText.textContent = message;
  resultArea.classList.remove("hidden");
}
