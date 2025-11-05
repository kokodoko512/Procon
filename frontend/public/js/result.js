document.addEventListener("DOMContentLoaded", async () => {
  const resultTbody = document.getElementById("players-result");

  try {
    const res = await fetch("https://procon-e8vw.onrender.com/api/result");
    const players = await res.json();

    console.log("取得データ:", players); // 確認用

    if (!Array.isArray(players) || players.length === 0) {
      alert("プレイヤー情報が取得できません");
      return;
    }

    players.forEach((player, index) => {
      const tr = document.createElement("tr");

      if (player.wolf) {
        tr.style.backgroundColor = "#f9b2b2";
        tr.style.fontWeight = "bold";
      }

      const tdName = document.createElement("td");
      tdName.textContent = player.name || `プレイヤー${index + 1}`;

      const tdSongName = document.createElement("td");
      tdSongName.textContent = player.title || "未選択";

      const tdTheme = document.createElement("td");
      tdTheme.textContent = player.theme_name || "—";

      const wolfTd = document.createElement("td");
      wolfTd.textContent = player.wolf ? "人狼" : "市民";

      tr.appendChild(tdName);
      tr.appendChild(tdSongName);
      tr.appendChild(tdTheme);
      tr.appendChild(wolfTd);

      resultTbody.appendChild(tr);
    });

  } catch (err) {
    console.error("取得エラー:", err);
    alert("プレイヤー情報の取得に失敗しました");
  }
});

async function restartGame() {
  try {
    const res = await fetch("https://procon-e8vw.onrender.com/api/reset-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error("リセットAPIの呼び出しに失敗しました");
    }

    const data = await res.json();
    console.log(data.message);

    // ローカルストレージ削除
    localStorage.clear();

    // room.htmlに遷移
    window.location.href = "room.html";
  } catch (err) {
    console.error("リセットエラー:", err);
    alert("ゲームのリセットに失敗しました");
  }
}