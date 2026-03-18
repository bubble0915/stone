const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const btn = document.getElementById("send-button");
const resultText = document.getElementById("result-text");
const resultArea = document.getElementById("result-area");
const resultMeta = document.getElementById("result-meta");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  btn.disabled = true;
  resultArea.classList.add("hidden");
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    if (data.ok) {
      resultMeta.textContent = "【鑑定結果】";
      resultText.textContent = data.text;
      resultArea.classList.remove("hidden");
    } else {
      // 画面を無視して、何が起きているかポップアップで表示！
      alert("⚠️ サーバーからの警告メッセージ:\n\n" + data.error);
    }
  } catch (error) {
    alert("⚠️ 通信エラーが発生しました:\n\n" + error.message);
  } finally {
    btn.disabled = false;
  }
});
