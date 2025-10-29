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
      // 末尾から削除（上部は消えない）
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

  // 🎯 プレイヤー登録（バックエンド連携）
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const playerInputs = document.querySelectorAll(".player-row input[type='text']");
    const playerNames = Array.from(playerInputs).map((input, i) => input.value.trim() || `プレイヤー${i + 1}`);

    // 空欄チェック
    if (playerNames.some(name => name === "")) {
      alert("全てのプレイヤー名を入力してください！");
      return;
    }

    try {
      // 🔄 ゲームデータをリセットしておく（DB初期化）
      await fetch("http://localhost:3000/api/reset-game", {
        method: "POST"
      });

      // 🔹 各プレイヤーを順に登録
      const registeredPlayers = [];
      for (const name of playerNames) {
        const res = await fetch("http://localhost:3000/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });

        if (!res.ok) throw new Error("プレイヤー登録に失敗");
        const player = await res.json();
        registeredPlayers.push(player);
      }

      // 🧠 ローカルストレージにも保存（次画面用）
      localStorage.setItem("players", JSON.stringify(registeredPlayers));

      // ✅ 次の画面へ
      window.location.href = "../check.html";
    } catch (err) {
      console.error("登録エラー:", err);
      alert("プレイヤー登録中にエラーが発生しました。サーバーを確認してください。");
    }
  });
});