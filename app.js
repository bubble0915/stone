const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");

const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultMeta = document.getElementById("result-meta");
const resultArea = document.getElementById("result-area");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = userInput.value.trim();
  if (!input) {
    showError("入力してください");
    return;
  }

  button.disabled = true;

  loading.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultMeta.classList.add("hidden");
  resultArea.classList.add("hidden");
  resultArea.innerHTML = "";

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
      showError(data.error || "通信エラー");
      return;
    }

    renderFullText(data.mode, data.text);

  } catch (error) {

    showError("通信に失敗しました");

  } finally {

    button.disabled = false;
    loading.classList.add("hidden");

  }
});


function renderFullText(mode, text) {

  resultArea.innerHTML = "";

  if (mode === "stone") {
    resultMeta.textContent = "天然石辞典として整理しました";
  } else {
    resultMeta.textContent = "今の気持ちに合う石を提案しました";
  }

  resultMeta.classList.remove("hidden");

  const block = document.createElement("div");
  block.className = "result-block";

  const p = document.createElement("p");

  /* ここが重要：AIの返答を一切加工せずそのまま表示 */
  p.textContent = text;

  block.appendChild(p);

  resultArea.appendChild(block);

  resultArea.classList.remove("hidden");
}


function showError(message) {

  resultArea.innerHTML = "";

  const block = document.createElement("div");
  block.className = "result-block";

  const p = document.createElement("p");
  p.textContent = message;

  block.appendChild(p);

  resultArea.appendChild(block);

  resultMeta.textContent = "エラー";
  resultMeta.classList.remove("hidden");

  resultArea.classList.remove("hidden");
}
