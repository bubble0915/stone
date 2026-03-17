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

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!response.ok) throw new Error("Workerサーバーが反応していません");

    const data = await response.json();

    if (data.ok) {
      resultMeta.textContent = "【鑑定結果】";
      resultText.textContent = data.text;
    } else {
      resultMeta.textContent = "【サーバーからの警告】";
      resultText.textContent = data.error;
    }
  } catch (error) {
    resultMeta.textContent = "【通信エラー】";
    resultText.textContent = "エラー詳細: " + error.message + "\n\n※URLが正しいか、Workerがデプロイされているか確認してください。";
  } finally {
    resultArea.classList.remove("hidden");
    resultMeta.classList.remove("hidden");
    loading.classList.add("hidden");
    button.disabled = false;
  }
});
