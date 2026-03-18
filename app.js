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
  resultText.textContent = ""; // 一旦空にする

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    resultArea.classList.remove("hidden");
    resultMeta.classList.remove("hidden");

    if (data.ok) {
      resultMeta.textContent = "【鑑定結果】";
      resultText.textContent = data.text; // ここで中身を流し込む
    } else {
      resultMeta.textContent = "【サーバーからの警告】";
      // ★ここが重要：警告の下にエラーの内容を直接書く
      resultText.textContent = "詳細: " + (data.error || "原因不明のエラー");
    }
  } catch (error) {
    resultArea.classList.remove("hidden");
    resultMeta.classList.remove("hidden");
    resultMeta.textContent = "【通信エラー】";
    resultText.textContent = "エラーが発生しました: " + error.message;
  } finally {
    loading.classList.add("hidden");
    button.disabled = false;
  }
});
