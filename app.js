const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

const form = document.getElementById("stone-form");
const userInput = document.getElementById("user-input");
const button = document.getElementById("send-button");

const loading = document.getElementById("loading");
const resultEmpty = document.getElementById("result-empty");
const resultArea = document.getElementById("result-area");

const block1Title = document.getElementById("block1-title");
const block1Text = document.getElementById("block1-text");
const block2Title = document.getElementById("block2-title");
const block2Text = document.getElementById("block2-text");
const block3Title = document.getElementById("block3-title");
const block3Text = document.getElementById("block3-text");
const block4Title = document.getElementById("block4-title");
const block4Text = document.getElementById("block4-text");
const block5Title = document.getElementById("block5-title");
const block5Text = document.getElementById("block5-text");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = userInput.value.trim();
  if (!input) {
    showSimpleError("入力してください。");
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
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    if (!data.ok) {
      showSimpleError(data.error || "通信エラーが発生しました。");
      return;
    }

    renderResult(data.mode, data.text);
  } catch (error) {
    showSimpleError("ごめんなさい。今は少し通信が不安定なようです。少し時間をおいて、もう一度お試しください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function renderResult(mode, text) {
  const sections = parseSections(text);

  if (mode === "stone") {
    block1Title.textContent = "石の名前";
    block1Text.textContent = sections["石の名前"] || "—";

    block2Title.textContent = "意味";
    block2Text.textContent = sections["意味"] || "—";

    block3Title.textContent = "効能";
    block3Text.textContent = sections["効能"] || "—";

    block4Title.textContent = "こんな時におすすめ";
    block4Text.textContent = sections["こんな時におすすめ"] || "—";

    block5Title.textContent = "取り扱いのヒント";
    block5Text.textContent = sections["取り扱いのヒント"] || "—";
  } else {
    block1Title.textContent = "今の気持ちへのやさしい対処法";
    block1Text.textContent = sections["今の気持ちへのやさしい対処法"] || "—";

    block2Title.textContent = "おすすめの石 1";
    block2Text.textContent = sections["おすすめの石1"] || "—";

    block3Title.textContent = "おすすめの石 2";
    block3Text.textContent = sections["おすすめの石2"] || "必要に応じて、ここは空欄でも大丈夫です。";

    block4Title.textContent = "おすすめの石 3";
    block4Text.textContent = sections["おすすめの石3"] || "必要に応じて、ここは空欄でも大丈夫です。";

    block5Title.textContent = "ひとこと";
    block5Text.textContent = sections["ひとこと"] || "今のあなたに合うやさしい石を、無理のない形で迎えてみてください。";
  }

  resultArea.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
}

function parseSections(text) {
  const sections = {};
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  let currentKey = "";
  const keys = [
    "石の名前",
    "意味",
    "効能",
    "こんな時におすすめ",
    "取り扱いのヒント",
    "今の気持ちへのやさしい対処法",
    "おすすめの石1",
    "おすすめの石2",
    "おすすめの石3",
    "ひとこと"
  ];

  for (const line of lines) {
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

function showSimpleError(message) {
  block1Title.textContent = "お知らせ";
  block1Text.textContent = message;

  block2Title.textContent = " ";
  block2Text.textContent = " ";
  block3Title.textContent = " ";
  block3Text.textContent = " ";
  block4Title.textContent = " ";
  block4Text.textContent = " ";
  block5Title.textContent = " ";
  block5Text.textContent = " ";

  resultArea.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
}
