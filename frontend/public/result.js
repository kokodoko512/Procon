document.addEventListener("DOMContentLoaded", () => {
  const players = JSON.parse(localStorage.getItem("players") || "[]");
  const operations = JSON.parse(localStorage.getItem("playerOperations") || "[]");

  const resultTbody = document.getElementById("players-result");

  players.forEach((player, index) => {
    const tr = document.createElement("tr");

    if (player.wolf) {
      tr.style.backgroundColor = "#ffcccc"; // 人狼は赤系
      tr.style.color = "#000000"; 
      tr.style.fontWeight = "bold";
    } else {
    }

    const tdName = document.createElement("td");
    tdName.textContent = player.name || `プレイヤー${index+1}`;

    const tdOperation = document.createElement("td");
    tdOperation.textContent = operations[index] || "未選択";

    const tdTheme = document.createElement("td");
    tdTheme.textContent = player.theme_name || "未設定";

    const wolfTd = document.createElement("td");
    wolfTd.textContent = player.wolf ? "🧟‍♀️ 人狼" : "🐏 市民";

    tr.appendChild(tdName);
    tr.appendChild(tdOperation);
    tr.appendChild(tdTheme);
    tr.appendChild(wolfTd);

    resultTbody.appendChild(tr);
  });
});

function restartGame() {
      localStorage.clear();
      window.location.href = "room.html"; // 最初の画面に戻す
    }