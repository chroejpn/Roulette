const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');

// --- 多言語化 (i18n) 設定 ---
const translations = {
    ja: {
        pageTitle: "ルーレット - プロファイル機能付き",
        titleProfile: "プロファイルの保存・読み込み",
        optDefault: "-- 保存済みから選択 --",
        loadBtn: "読み込む",
        deleteBtn: "削除",
        profilePlaceholder: "新しいプロファイル名",
        saveBtn: "現在の項目を保存",
        titleEdit: "項目の編集",
        descEdit: "「項目名:割合」で重みを設定できます（例: A:1）<br>改行で区切ってください．",
        updateBtn: "ルーレットを更新",
        spinBtn: "回す！",
        resultPrefix: "結果: ",
        alertEnterName: "プロファイル名を入力してください．",
        alertEnterItem: "項目を1つ以上入力してください．",
        alertSaved: "「{name}」を保存しました．",
        confirmDelete: "「{name}」を削除してもよろしいですか？",
        noItem: "項目なし"
    },
    en: {
        pageTitle: "Roulette - with Profile Feature",
        titleProfile: "Save / Load Profiles",
        optDefault: "-- Select from saved --",
        loadBtn: "Load",
        deleteBtn: "Delete",
        profilePlaceholder: "New profile name",
        saveBtn: "Save Current Items",
        titleEdit: "Edit Items",
        descEdit: "Set weights with 'Name:Weight' (e.g. A:1)<br>Separate items by newlines.",
        updateBtn: "Update Roulette",
        spinBtn: "Spin!",
        resultPrefix: "Result: ",
        alertEnterName: "Please enter a profile name.",
        alertEnterItem: "Please enter at least one item.",
        alertSaved: "\"{name}\" has been saved.",
        confirmDelete: "Are you sure you want to delete \"{name}\"?",
        noItem: "No items"
    }
};

// 言語の初期化（前回の設定があれば読み込む）
let currentLang = localStorage.getItem('myRouletteLang') || 'ja';
document.getElementById('langSelect').value = currentLang;

// 言語切り替えメニューが操作されたときの処理
document.getElementById('langSelect').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('myRouletteLang', currentLang); // 選択した言語を保存
    applyLanguage(); // テキストの翻訳を適用
    updateProfileSelect(); // ドロップダウンの言語を更新
    updateRouletteItems(); // ルーレット盤面の言語を更新
});
// --- ダークモード (Theme) 設定 ---
const themeToggleCheckbox = document.getElementById('themeToggleCheckbox');
let isDarkMode = localStorage.getItem('myRouletteTheme') === 'dark';

// モードを画面に反映する関数
function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggleCheckbox.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleCheckbox.checked = false;
    }
}

// スイッチがクリックされたときの処理
themeToggleCheckbox.addEventListener('change', (e) => {
    isDarkMode = e.target.checked;
    localStorage.setItem('myRouletteTheme', isDarkMode ? 'dark' : 'light'); // 状態を保存
    applyTheme();
});

// 初期化（ページ読み込み時に実行）
applyTheme();

// 画面上のテキストを翻訳辞書から引っ張ってきて書き換える関数
function applyLanguage() {
    const t = translations[currentLang];
    document.title = t.pageTitle;
    document.getElementById('titleProfile').innerText = t.titleProfile;
    document.getElementById('loadBtn').innerText = t.loadBtn;
    document.getElementById('deleteBtn').innerText = t.deleteBtn;
    document.getElementById('profileName').placeholder = t.profilePlaceholder;
    document.getElementById('saveBtn').innerText = t.saveBtn;
    document.getElementById('titleEdit').innerText = t.titleEdit;
    document.getElementById('descEdit').innerHTML = t.descEdit;
    document.getElementById('updateBtn').innerText = t.updateBtn;
    document.getElementById('spinBtn').innerText = t.spinBtn;
    
    const resultDiv = document.getElementById('result');
    if (resultDiv.innerText !== "") {
        const currentItem = resultDiv.innerText.split(/:\s(.+)|：(.+)/).filter(Boolean)[1] || "";
        if (currentItem) resultDiv.innerText = t.resultPrefix + currentItem;
    }
}


// --- 以下のルーレットの仕組みは前回と同じですが，テキスト部分に変数「t」を使っています ---
let itemsData = []; 
let totalWeight = 0;
let startAngle = 0;
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

const STORAGE_KEY = 'myRouletteProfiles';

function loadProfiles() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function updateProfileSelect() {
    const t = translations[currentLang];
    const select = document.getElementById('profileSelect');
    const profiles = loadProfiles();
    select.innerHTML = `<option value="">${t.optDefault}</option>`;
    for (const name in profiles) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

document.getElementById('saveBtn').addEventListener('click', () => {
    const t = translations[currentLang];
    const profileName = document.getElementById('profileName').value.trim();
    const currentItems = document.getElementById('itemInput').value.split('\n').filter(i => i.trim() !== '');
    
    if (!profileName) {
        alert(t.alertEnterName);
        return;
    }
    if (currentItems.length === 0) {
        alert(t.alertEnterItem);
        return;
    }

    const profiles = loadProfiles();
    profiles[profileName] = currentItems;
    saveProfiles(profiles);
    updateProfileSelect();
    alert(t.alertSaved.replace('{name}', profileName));
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
    const t = translations[currentLang];
    const profileName = document.getElementById('profileSelect').value;
    if (!profileName) return;

    if (confirm(t.confirmDelete.replace('{name}', profileName))) {
        const profiles = loadProfiles();
        delete profiles[profileName];
        saveProfiles(profiles);
        updateProfileSelect();
        document.getElementById('profileSelect').value = "";
    }
});

function updateRouletteItems() {
    const t = translations[currentLang];
    const text = document.getElementById('itemInput').value;
    const lines = text.split('\n').filter(i => i.trim() !== '');
    
    itemsData = [];
    totalWeight = 0;

    if(lines.length === 0) {
        itemsData = [{ text: t.noItem, weight: 1 }];
        totalWeight = 1;
    } else {
        lines.forEach(line => {
            let parts = line.split(/[:：]/);
            let name = parts[0].trim();
            let weight = 1;

            if (parts.length > 1) {
                let parsedWeight = parseFloat(parts[1]);
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
        const itemArc = (Math.PI * 2) * (item.weight / totalWeight);
        
        ctx.fillStyle = `hsl(${i * 360 / itemsData.length}, 70%, 80%)`;
        
        ctx.beginPath();
        ctx.arc(150, 150, 150, currentAngle, currentAngle + itemArc, false);
        ctx.lineTo(150, 150);
        ctx.fill();
        ctx.stroke();
        
        ctx.save();
        ctx.fillStyle = "black";
        const textAngle = currentAngle + itemArc / 2;
        ctx.translate(150 + Math.cos(textAngle) * 100, 
                      150 + Math.sin(textAngle) * 100);
        ctx.rotate(textAngle + Math.PI / 2);
        
        const text = item.text;
        ctx.font = "16px sans-serif";
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();

        currentAngle += itemArc;
    }
    
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
    const t = translations[currentLang];
    cancelAnimationFrame(spinTimeout);
    
    let pointerAngleOnWheel = (1.5 * Math.PI - startAngle) % (2 * Math.PI);
    if (pointerAngleOnWheel < 0) pointerAngleOnWheel += 2 * Math.PI;

    let winningItem = itemsData[0].text;
    let cumulativeAngle = 0;

    for (let i = 0; i < itemsData.length; i++) {
        const itemArc = (Math.PI * 2) * (itemsData[i].weight / totalWeight);
        cumulativeAngle += itemArc;
        if (pointerAngleOnWheel <= cumulativeAngle) {
            winningItem = itemsData[i].text;
            break;
        }
    }

    document.getElementById('result').innerText = t.resultPrefix + winningItem;
}

document.getElementById('updateBtn').addEventListener('click', updateRouletteItems);

document.getElementById('spinBtn').addEventListener('click', () => {
    const t = translations[currentLang];
    if (itemsData.length <= 1 && itemsData[0].text === t.noItem) return;
    document.getElementById('result').innerText = "";
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000;
    rotateWheel();
});

// 初期化処理（ページを読み込んだときに一番最初に実行されます）
applyLanguage();
updateProfileSelect();
updateRouletteItems();
