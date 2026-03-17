const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");
const loading = document.getElementById("loading");
const resultArea = document.getElementById("result-area");
const resultText = document.getElementById("result-text");
const resultMeta = document.getElementById("result-meta");
const resultEmpty = document.getElementById("result-empty");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  // 画面をリセット
  button.disabled = true;
  loading.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultArea.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultText.textContent = "読み取り中..."; // 先に文字を入れておく

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    // 画面に無理やり表示させる
    resultArea.classList.remove("hidden");
    resultMeta.classList.remove("hidden");

    if (data.ok) {
      resultMeta.textContent = data.mode === "stone" ? "【石の辞典】" : "【心の提案】";
      resultText.textContent = data.text;
    } else {
      resultMeta.textContent = "【サーバーからの警告】";
      // ★ここ！data.error が空でも「不明なエラー」と出すようにガード
      resultText.textContent = data.error || "原因不明のエラーが発生しました。APIキーを確認してください。";
    }
  } catch (error) {
    resultArea.classList.remove("hidden");
    resultMeta.textContent = "【通信エラー】";
    resultText.textContent = "接続に失敗しました: " + error.message;
  } finally {
    loading.classList.add("hidden");
    button.disabled = false;
  }
});
