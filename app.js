const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");
const loading = document.getElementById("loading");
const resultArea = document.getElementById("result-area");
const resultText = document.getElementById("result-text");
const resultMeta = document.getElementById("result-meta");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  button.disabled = true;
  loading.classList.remove("hidden");
  resultArea.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultText.textContent = "";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    if (data.ok && data.text) {
      resultMeta.textContent = data.mode === "stone" ? "【石の辞典】" : "【心の提案】";
      // ★ここ：受け取ったテキストをそのまま流し込む
      resultText.textContent = data.text;
      resultArea.classList.remove("hidden");
      resultMeta.classList.remove("hidden");
    } else {
      resultMeta.textContent = "【サーバーからのメッセージ】";
      resultText.textContent = data.error || "データが空でした。";
      resultArea.classList.remove("hidden");
      resultMeta.classList.remove("hidden");
    }
  } catch (error) {
    resultMeta.textContent = "【エラー】";
    resultText.textContent = "通信に失敗しました。時間を置いて再度お試しください。";
    resultArea.classList.remove("hidden");
    resultMeta.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
    button.disabled = false;
  }
});
