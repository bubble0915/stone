const API_KEY = 'AIzaSyCza86JGUhKy1tBVgeOBJiFbhdMaClSb-Q';

async function execute(mode) {
    const userInput = document.getElementById('user-input').value;
    const resultArea = document.getElementById('result-area');

    if (!userInput.trim()) {
        alert(mode === 'diagnosis' ? "お悩みや願いを入力してください" : "調べたい石の名前を入力してください");
        return;
    }

    resultArea.innerHTML = `<div class='loading'>✨ ${mode === 'diagnosis' ? '運命の石を選定中...' : '図鑑の記録を呼び出しています...'}</div>`;

    // プロンプトの切り替え
    const prompt = mode === 'diagnosis'
        ? `あなたはプロのパワーストーン鑑定士です。悩み「${userInput}」に対し、最適な石を1つ〜最大3つ選び、名前を【石の名前】として記述してください。自己紹介や挨拶は一切禁止し、いきなり石の解説と作用について、神秘的な日本語で詳しく語ってください。`
        : `あなたは石図鑑の編纂者です。石「${userInput}」について、科学的特徴、石言葉、伝承、浄化方法を日本語で詳しく解説してください。冒頭に必ず【石の名前】を入れ、挨拶は一切抜きで始めてください。`;

    try {
        // 1. テキスト生成
        const diagUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        const diagRes = await fetch(diagUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const diagData = await diagRes.json();
        const fullText = diagData.candidates[0].content.parts[0].text;
        
        // 石の名前抽出
        const stones = fullText.match(/【(.*?)】/g)?.map(s => s.replace(/[【】]/g, '')) || [userInput];

        // 2. 画像生成
        const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
        const imgRes = await fetch(imgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: `A cinematic, high-quality photograph of ${stones.join(" and ")} crystals, mystical atmosphere, glowing light, professional studio lighting.` }]
            })
        });
        const imgData = await imgRes.json();
        
        let imageTag = "";
        if (imgData.predictions?.[0]?.bytesBase64Encoded) {
            imageTag = `<img src="data:image/png;base64,${imgData.predictions[0].bytesBase64Encoded}">`;
        }

        // 3. 結果表示
        resultArea.innerHTML = `
            <div class="result-card" style="animation: fadeIn 1s ease;">
                ${imageTag}
                <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
                    ${stones.map(s => `<span style="background:rgba(224,195,252,0.15); border:1px solid #e0c3fc; padding:6px 15px; border-radius:4px; font-size:0.9rem; font-weight:bold;">${s}</span>`).join('')}
                </div>
                <div style="line-height:2.2; font-size:0.95rem; color:#f0f0f0;">
                    ${fullText.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        resultArea.innerHTML = "⚠️ 石との共鳴に失敗しました。";
    }
}