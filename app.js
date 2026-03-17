const WORKER_URL = "https://stone-01.its-brg77.workers.dev";

async function askStone() {
  const input = document.getElementById("stoneInput").value;
  const output = document.getElementById("stoneOutput");

  if (!input) {
    output.innerText = "質問を入力してください。";
    return;
  }

  output.innerText = "石の声を聞いています…";

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: input
      })
    });

    const data = await res.json();

    if (data.ok) {
      output.innerText = data.text;
    } else {
      output.innerText = "AIが答えられませんでした。";
    }

  } catch (err) {
    output.innerText = "通信エラーが発生しました。";
  }
}
