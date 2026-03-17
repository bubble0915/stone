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
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (data.ok) {
      resultMeta.textContent = data.mode === "stone" ? "【石の辞典】" : "【心の提案】";
      resultMeta.classList.remove("hidden");
      resultText.textContent = data.text;
      resultArea.classList.remove("hidden");
    } else {
      // ここで詳細なエラーを表示
      showError("サーバーエラー: " + data.error);
    }
  } catch (error) {
    showError("通信エラー: 接続に失敗しました。URLが正しいか確認してください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function showError(message) {
  resultMeta.textContent = "デバッグ情報";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultText.textContent = message;
  resultArea.classList.remove("hidden");
}
