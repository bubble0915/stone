const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const stoneNameInput = document.getElementById("stone-name");
const stoneFeelingInput = document.getElementById("stone-feeling");
const button = document.getElementById("send-button");

const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultArea = document.getElementById("result-area");

const resultStone = document.getElementById("result-stone");
const resultMeaning = document.getElementById("result-meaning");
const resultMessage = document.getElementById("result-message");
const resultCare = document.getElementById("result-care");
const resultPartner = document.getElementById("result-partner");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const stoneName = stoneNameInput.value.trim();
  const feeling = stoneFeelingInput.value.trim();

  if (!stoneName || !feeling) {
    showError("石の名前と、今の気持ちの両方を入力してください。");
    return;
  }

  button.disabled = true;
  loading.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultArea.classList.add("hidden");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stoneName,
        feeling
      })
    });

    const data = await response.json();

    if (!data.ok) {
      showError(`エラー: ${data.error || "通信エラーが発生しました。"}`);
      return;
    }

    renderResult(data.text, stoneName);
  } catch (error) {
    showError("ごめんなさい。今は少し通信が不安定なようです。少し時間をおいて、もう一度そっと話しかけてみてください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function renderResult(text, stoneName) {
  const parsed = parseSections(text);

  resultStone.textContent = parsed["石の名前"] || stoneName;
  resultMeaning.textContent = parsed["石のやさしい意味"] || "やさしい意味をうまく受け取れませんでした。";
  resultMessage.textContent = parsed["今のあなたへのつぶやき"] || text;
  resultCare.textContent = parsed["おすすめの寄り添い方"] || "今は、無理のない距離で石をそっと身近に置いてみてください。";
  resultPartner.textContent = parsed["相性のよい石"] || "必要に応じて、水晶のような穏やかな石とも相性がよいかもしれません。";

  resultArea.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
}

function parseSections(text) {
  const sections = {};
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  let currentKey = "";

  for (const line of lines) {
    const keys = [
      "石の名前",
      "石のやさしい意味",
      "今のあなたへのつぶやき",
      "おすすめの寄り添い方",
      "相性のよい石"
    ];

    const matchedKey = keys.find(key => line.startsWith(key));
    if (matchedKey) {
      currentKey = matchedKey;
      const value = line.replace(matchedKey, "").replace(/^[:：]/, "").trim();
      sections[currentKey] = value;
    } else if (currentKey) {
      sections[currentKey] = sections[currentKey]
        ? sections[currentKey] + "\n" + line
        : line;
    }
  }

  return sections;
}

function showError(message) {
  resultStone.textContent = "石のつぶやきAI";
  resultMeaning.textContent = "今は少し声が遠いようです。";
  resultMessage.textContent = message;
  resultCare.textContent = "少し時間をおいて、やさしくもう一度お試しください。";
  resultPartner.textContent = "水晶のような静かな石を思い浮かべながら待つのもよいかもしれません。";

  resultArea.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
}
