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
    renderError("入力してください。");
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
      renderError(data.error || "通信エラーが発生しました。");
      return;
    }

    renderSections(data.mode, data.text);
  } catch (error) {
    renderError("ごめんなさい。今は少し通信が不安定なようです。少し時間をおいて、もう一度お試しください。");
  } finally {
    button.disabled = false;
    loading.classList.add("hidden");
  }
});

function renderSections(mode, text) {
  const sections = parseSections(text);
  const entries = Object.entries(sections).filter(([_, value]) => value && value.trim());

  resultArea.innerHTML = "";

  if (mode === "stone") {
    resultMeta.textContent = "石の名前として受け取り、辞典のように整理しました。";
  } else {
    resultMeta.textContent = "今の気持ちとして受け取り、対処法と合う石を整理しました。";
  }

  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");

  if (entries.length === 0) {
    const block = createBlock("結果", text || "結果をうまく整理できませんでした。");
    resultArea.appendChild(block);
  } else {
    for (const [title, value] of entries) {
      const block = createBlock(title, value);
      resultArea.appendChild(block);
    }
  }

  resultArea.classList.remove("hidden");
}

function createBlock(title, text) {
  const div = document.createElement("div");
  div.className = "result-block";

  const h3 = document.createElement("h3");
  h3.textContent = title;

  const p = document.createElement("p");
  p.textContent = text;

  div.appendChild(h3);
  div.appendChild(p);

  return div;
}

function parseSections(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const sections = {};
  let currentKey = "";
  let buffer = [];

  for (const line of lines) {
    const inlineMatch = line.match(/^(.+?)\s*[:：]\s*(.+)$/);

    if (inlineMatch) {
      if (currentKey) {
        sections[currentKey] = buffer.join("\n").trim();
      }

      currentKey = inlineMatch[1].trim();
      buffer = [inlineMatch[2].trim()];
      continue;
    }

    const looksLikeHeading = isHeadingLine(line);

    if (looksLikeHeading) {
      if (currentKey) {
        sections[currentKey] = buffer.join("\n").trim();
      }

      currentKey = line.trim();
      buffer = [];
      continue;
    }

    if (!currentKey) {
      currentKey = "結果";
      buffer = [line];
    } else {
      buffer.push(line);
    }
  }

  if (currentKey) {
    sections[currentKey] = buffer.join("\n").trim();
  }

  return sections;
}

function isHeadingLine(line) {
  if (line.length > 30) return false;
  if (line.includes("。")) return false;
  if (line.includes("、")) return false;

  const headingCandidates = [
    "石の名前",
    "意味",
    "効能",
    "こんな時におすすめ",
    "取り扱いのヒント",
    "浄化方法",
    "注意点",
    "相性のよい石",
    "今の気持ちへのやさしい対処法",
    "おすすめの石1",
    "おすすめの石2",
    "おすすめの石3",
    "おすすめの石",
    "選んだ理由",
    "理由",
    "ひとこと",
    "日常でできる対処法"
  ];

  return headingCandidates.includes(line);
}

function renderError(message) {
  resultMeta.textContent = "お知らせ";
  resultMeta.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
  resultArea.classList.remove("hidden");
  resultArea.innerHTML = "";

  resultArea.appendChild(createBlock("内容", message));
}
