const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');

// itemsをオブジェクトの配列に変更（text: 項目名, weight: 重み）
let itemsData = []; 
let totalWeight = 0;

let startAngle = 0;
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

// --- プロファイル管理 (LocalStorage) ---
const STORAGE_KEY = 'myRouletteProfiles';

function loadProfiles() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function updateProfileSelect() {
    const select = document.getElementById('profileSelect');
    const profiles = loadProfiles();
    select.innerHTML = '<option value="">-- 保存済みから選択 --</option>';
    for (const name in profiles) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

document.getElementById('saveBtn').addEventListener('click', () => {
    const profileName = document.getElementById('profileName').value.trim();
    const currentItems = document.getElementById('itemInput').value.split('\n').filter(i => i.trim() !== '');
    
    if (!profileName) {
        alert('プロファイル名を入力してください．');
        return;
    }
    if (currentItems.length === 0) {
        alert('項目を1つ以上入力してください．');
        return;
    }

    const profiles = loadProfiles();
    profiles[profileName] = currentItems;
    saveProfiles(profiles);
    updateProfileSelect();
    alert(`「${profileName}」を保存しました．`);
});

document.getElementById('loadBtn').addEventListener('click', () => {
    const profileName = document.getElementById('profileSelect').value;
    if (!profileName) return;

    const profiles = loadProfiles();
    if (profiles[profileName]) {
        document.getElementById('itemInput').value = profiles[profileName].join('\n');
        updateRouletteItems();
    }
});

document.getElementById('deleteBtn').addEventListener('click', () => {
    const profileName = document.getElementById('profileSelect').value;
    if (!profileName) return;

    if (confirm(`「${profileName}」を削除してもよろしいですか？`)) {
        const profiles = loadProfiles();
        delete profiles[profileName];
        saveProfiles(profiles);
        updateProfileSelect();
        document.getElementById('profileSelect').value = "";
    }
});


// --- ルーレット描画・回転処理 ---
function updateRouletteItems() {
    const text = document.getElementById('itemInput').value;
    const lines = text.split('\n').filter(i => i.trim() !== '');
    
    itemsData = [];
    totalWeight = 0;

    if(lines.length === 0) {
        itemsData = [{ text: "項目なし", weight: 1 }];
        totalWeight = 1;
    } else {
        lines.forEach(line => {
            // 半角コロンまたは全角コロンで分割
            let parts = line.split(/[:：]/);
            let name = parts[0].trim();
            let weight = 1; // デフォルトの割合は1

            if (parts.length > 1) {
                let parsedWeight = parseFloat(parts[1]);
                // 数字として正しい，かつ0より大きい場合のみ重みを適用
                if (!isNaN(parsedWeight) && parsedWeight > 0) {
                    weight = parsedWeight;
                }
            }
            itemsData.push({ text: name, weight: weight });
            totalWeight += weight;
        });
    }
    drawRouletteWheel();
}

function drawRouletteWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;

    let currentAngle = startAngle;

    for(let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        // 割合に応じた角度（弧）を計算
        const itemArc = (Math.PI * 2) * (item.weight / totalWeight);
        
        ctx.fillStyle = `hsl(${i * 360 / itemsData.length}, 70%, 80%)`;
        
        ctx.beginPath();
        ctx.arc(150, 150, 150, currentAngle, currentAngle + itemArc, false);
        ctx.lineTo(150, 150);
        ctx.fill();
        ctx.stroke();
        
        ctx.save();
        ctx.fillStyle = "black";
        // 文字の配置角度を，その項目の中心に合わせる
        const textAngle = currentAngle + itemArc / 2;
        ctx.translate(150 + Math.cos(textAngle) * 100, 
                      150 + Math.sin(textAngle) * 100);
        ctx.rotate(textAngle + Math.PI / 2);
        
        // テキストを描画（長すぎる場合は割合の数字も入っているので名前だけにする等も可）
        const text = item.text;
        ctx.font = "16px sans-serif";
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();

        // 次の項目の描画開始位置を更新
        currentAngle += itemArc;
    }
    
    // ポインター
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(150 - 10, 0);
    ctx.lineTo(150 + 10, 0);
    ctx.lineTo(150, 20);
    ctx.fill();
}

function rotateWheel() {
    spinTime += 30;
    if(spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinAngleStart - (spinAngleStart * (spinTime / spinTimeTotal));
    startAngle += (spinAngle * Math.PI / 180);
    drawRouletteWheel();
    spinTimeout = requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
    cancelAnimationFrame(spinTimeout);
    
    // ポインターの位置（真上＝1.5 * Math.PI）から，現在の盤面の回転角度を引く
    let pointerAngleOnWheel = (1.5 * Math.PI - startAngle) % (2 * Math.PI);
    if (pointerAngleOnWheel < 0) pointerAngleOnWheel += 2 * Math.PI;

    let winningItem = itemsData[0].text;
    let cumulativeAngle = 0;

    // ポインターの角度が，どの項目の角度の範囲内に収まっているかを判定
    for (let i = 0; i < itemsData.length; i++) {
        const itemArc = (Math.PI * 2) * (itemsData[i].weight / totalWeight);
        cumulativeAngle += itemArc;
        if (pointerAngleOnWheel <= cumulativeAngle) {
            winningItem = itemsData[i].text;
            break;
        }
    }

    document.getElementById('result').innerText = "結果: " + winningItem;
}

document.getElementById('updateBtn').addEventListener('click', updateRouletteItems);

document.getElementById('spinBtn').addEventListener('click', () => {
    if (itemsData.length <= 1 && itemsData[0].text === "項目なし") return;
    document.getElementById('result').innerText = "";
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000;
    rotateWheel();
});

// 初期化処理
updateProfileSelect();
updateRouletteItems();
