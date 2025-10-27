const urlParams = new URLSearchParams(window.location.search);
const currentIndex = parseInt(urlParams.get("player")) || 0;

const players = JSON.parse(localStorage.getItem("players") || "[]");

const currentPlayer = players[currentIndex];

const playerName = currentPlayer?.name || `プレイヤー${currentIndex+1}`
const playerTheme = currentPlayer?.theme_name || `テーマ`;

document.getElementById("theme").textContent = `${playerName}さんのテーマは${playerTheme}です`;

// 操作完了ボタン
document.getElementById("submit").addEventListener("click", () => {
    const operation = document.getElementById("operation").value.trim();
    if(!operation) { alert("操作を入力してください"); return; 
    }

    // 保存
    const operations = JSON.parse(localStorage.getItem("playerOperations") || "[]");
    operations[currentIndex] = operation;
    localStorage.setItem("playerOperations", JSON.stringify(operations));

    // 次のプレイヤー判定
    if(currentIndex + 1 < players.length){
        // 次のプレイヤー確認画面へ
        window.location.href = `check.html?player=${currentIndex + 1}`;
    } else {
        // 全員完了したらページ②へ
        window.location.href = "play.html";
    }
});