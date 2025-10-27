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

  // ← 仮データ（MySQL接続前の擬似データ）
  const mockPlayers = [
    { user_id: 1, name: "プレイヤー１", theme_name: "失恋" },
    { user_id: 2, name: "プレイヤー２", theme_name: "順調な恋" },
    { user_id: 3, name: "プレイヤー３", theme_name: "順調な恋" },
    { user_id: 4, name: "プレイヤー４", theme_name: "順調な恋" }
  ];

      form.addEventListener("submit", (e) => {
         e.preventDefault();

    // すべてのプレイヤー名入力欄を取得
        const playerInputs = document.querySelectorAll(".player-row input[type='text']");
        let allFilled = true;

            
        const updatedPlayers = Array.from(playerInputs).map((input, index) => {
        const name = input.value.trim();
        if (!name) allFilled = false;

        return{
            user_id: index + 1,
            name: name || `プレイヤー${index + 1}`,
            theme_name: mockPlayers[index]?.theme_name || "未設定"
        };
    });

    if (!allFilled) {
       alert("全てのプレイヤー名を入力してください！");
       return; // 送信中止
    }


    // localStorage に保存
    localStorage.setItem("players", JSON.stringify(updatedPlayers));

    // すべて入力済みなら画面遷移
    window.location.href = "../check.html";
    });
});