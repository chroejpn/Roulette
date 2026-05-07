const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');

let items = [];
let startAngle = 0;
let arc = 0;
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
    items = text.split('\n').filter(i => i.trim() !== '');
    if(items.length === 0) items = ["項目なし"];
    arc = Math.PI * 2 / items.length;
    drawRouletteWheel();
}

function drawRouletteWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- 追加：区切り線の色と太さを設定 ---
    ctx.strokeStyle = "#333"; // 区切り線の色（黒に近いグレー）
    ctx.lineWidth = 1;        // 区切り線の太さ
    // ------------------------------------

    for(let i = 0; i < items.length; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = `hsl(${i * 360 / items.length}, 70%, 80%)`;
        
        ctx.beginPath();
        ctx.arc(150, 150, 150, angle, angle + arc, false);
        ctx.lineTo(150, 150);
        ctx.fill();
        ctx.stroke(); // ← 追加：ここで線を描画します
        
        ctx.save();
        ctx.fillStyle = "black";
        ctx.translate(150 + Math.cos(angle + arc / 2) * 100, 
                      150 + Math.sin(angle + arc / 2) * 100);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        const text = items[i];
        ctx.font = "16px sans-serif";
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();
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
    let relativeAngle = (1.5 * Math.PI - startAngle) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;
    const index = Math.floor(relativeAngle / arc);
    document.getElementById('result').innerText = "結果: " + items[index];
}

document.getElementById('updateBtn').addEventListener('click', updateRouletteItems);

document.getElementById('spinBtn').addEventListener('click', () => {
    if (items.length <= 1 && items[0] === "項目なし") return;
    document.getElementById('result').innerText = "";
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000;
    rotateWheel();
});

// 初期化処理
updateProfileSelect();
updateRouletteItems();