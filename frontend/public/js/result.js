document.addEventListener("DOMContentLoaded", async () => {
  
  const resultTbody = document.getElementById("players-result");

  try {
    // 👥 DBからプレイヤー一覧取得
    const res = await fetch("http://localhost:3000/api/players");
    const players = await res.json();
    const operations = [];

    if (!players || players.length === 0) {
      alert("プレイヤー情報が取得できません");
      return;
    }
    players.forEach((player, index) => {
    const tr = document.createElement("tr");

    if (player.wolf) {
      tr.style.backgroundColor = "#f9b2b2ff"; // 人狼は赤系
      tr.style.color = "#000000"; 
      tr.style.fontWeight = "bold";
    } else {
    }

    const tdName = document.createElement("td");
    tdName.textContent = player.name || `プレイヤー${index+1}`;

    const tdSongName = document.createElement("td");
    tdSongName.textContent = player.song_id || "未選択";

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
} catch (err) {
  console.error(err);
  alert("プレイヤー情報の取得に失敗しました");
}
});

function restartGame() {
      localStorage.clear();
      window.location.href = "room.html"; // 最初の画面に戻す
}