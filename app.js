const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const input = document.getElementById("stone-input");
const output = document.getElementById("stone-output");
const button = document.getElementById("send-button");

if (!form || !input || !output || !button) {
  console.error("HTMLのIDが一致していません。");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) {
    output.textContent = "質問を入力してください。";
    return;
  }

  button.disabled = true;
  output.textContent = "石の声を、静かに受け取っています…";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!data.ok) {
      output.textContent = `エラー: ${data.error || "通信エラー"}`;
      return;
    }

    output.textContent = data.text;
  } catch (error) {
    console.error(error);
    output.textContent =
      "ごめんなさい。今は少し通信が不安定なようです。少し時間をおいて、もう一度そっと話しかけてみてください。";
  } finally {
    button.disabled = false;
  }
});
