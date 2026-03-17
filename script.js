// 1. 必ず新しいプロジェクト（...2896）の警告なしキーを貼ってください
const KEY = 'AIzaSyCQGI4FaAFvLpTyI2Em5IGoAm3_02hNAYI'; 

async function execute(type) {
    const resArea = document.getElementById('resultArea');
    const input = document.getElementById('stoneInput').value.trim();
    if (!input) return alert('石の名前を入力してください');

    resArea.innerHTML = '✨ 石の記憶を呼び起こしています...';

    // 2. 無料枠で最も安定して通るURL（v1beta / gemini-1.5-flash）
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: input + "について、石の鑑定士として、その石が持つメッセージを150文字以内で優しく語りかけて。" }]
                }]
            })
        });

        const data = await response.json();

        // エラーが出た場合
        if (data.error) {
            throw new Error(data.error.message);
        }

        // 成功：石のメッセージを表示
        const text = data.candidates[0].content.parts[0].text;
        resArea.innerHTML = `<div style="line-height:1.8; color:#fff; background:rgba(255,255,255,0.1); padding:20px; border-radius:15px; border:1px solid rgba(255,255,255,0.2);">${text.replace(/\n/g, '<br>')}</div>`;

    } catch (e) {
        // エラー内容を表示（これで原因が特定できます）
        resArea.innerHTML = `<div style="color:#ffb3b3; font-size:14px; padding:10px;">鑑定失敗：${e.message}</div>`;
    }
}
