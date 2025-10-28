document.addEventListener("DOMContentLoaded", () => {
  const countDisplay = document.getElementById("player-count");
  const decreaseBtn = document.querySelector('button[data-action="decrease"]');
  const increaseBtn = document.querySelector('button[data-action="increase"]');
  const playerList = document.querySelector(".play-list");
  const form = document.getElementById("players-form");

  let count = 4; // 初期人数

  // 🎯 プレイヤーリストを更新する関数
  function updatePlayerList() {
    const rows = playerList.querySelectorAll(".player-row");
    const currentRows = rows.length;

    if (count > currentRows) {
      // 末尾に追加
      for (let i = currentRows + 1; i <= count; i++) {
        const newRow = document.createElement("div");
        newRow.classList.add("player-row");
        newRow.dataset.index = i;
        newRow.innerHTML = `
          <label for="player-${i}" class="sr-only">プレイヤー${i}</label>
          <input
            id="player-${i}"
            name="player-${i}"
            type="text"
            placeholder="プレイヤー${i}"
            maxlength="30"
            aria-required="true"
          />
        `;
        playerList.appendChild(newRow);
      }
    } else if (count < currentRows) {
      // 末尾から削除
      const rowsToRemove = currentRows - count;
      for (let i = 0; i < rowsToRemove; i++) {
        const row = rows[rows.length - 1 - i];
        if (row) row.remove();
      }
    }

    countDisplay.textContent = count;
  }

  updatePlayerList();

  // ▶ 増加ボタン
  increaseBtn.addEventListener("click", () => {
    if (count < 10) {
      count++;
      updatePlayerList();
    }
  });

  // ◀ 減少ボタン
  decreaseBtn.addEventListener("click", () => {
    if (count > 3) {
      count--;
      updatePlayerList();
    }
  });

  // 🎯 フォーム送信イベント
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const playerInputs = document.querySelectorAll(".player-row input[type='text']");
    let allFilled = true;

    const players = Array.from(playerInputs).map((input, index) => {
      const name = input.value.trim();
      if (!name) allFilled = false;

      return {
        user_id: index + 1,
        name: name || `プレイヤー${index + 1}`,
        theme_name: "未設定"
      };
    });

    if (!allFilled) {
      alert("全てのプレイヤー名を入力してください！");
      return;
    }

    try {
      // 🔥 Node.js サーバーに送信
      const responses = await Promise.all(
        players.map(async (player) => {
          const res = await fetch("http://localhost:3000/api/players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: player.name })
          });
          if (!res.ok) throw new Error(`登録失敗: ${player.name}`);
          return res.json();
        })
      );

      console.log("登録成功:", responses);

      // 💾 localStorage に保存（既存処理）
      localStorage.setItem("players", JSON.stringify(players));

      // ✅ 次の画面へ遷移
      window.location.href = "../check.html";

    } catch (error) {
      console.error("通信エラー:", error);
      alert("サーバーとの通信に失敗しました。");
    }
  });
});
