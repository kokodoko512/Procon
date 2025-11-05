document.addEventListener("DOMContentLoaded", async () => {
  const helpBtn = document.getElementById("help-btn");
  const helpBubble = document.getElementById("help-bubble");

  helpBtn.addEventListener("click", () => {
    helpBubble.classList.toggle("show");
  });

  const countDisplay = document.getElementById("player-count");
  const decreaseBtn = document.querySelector('button[data-action="decrease"]');
  const increaseBtn = document.querySelector('button[data-action="increase"]');
  const playerList = document.querySelector(".play-list");
  const form = document.getElementById("players-form");
  const themeSelect = document.getElementById("theme-select"); // ジャンルセレクト取得

  let count = 4; // 初期人数

  // ジャンル一覧をDBから取得して反映
  try {
    const response = await fetch("http://10.75.63.165:3000/api/genres");
    if (!response.ok) throw new Error("ジャンル取得に失敗しました");
    const genres = await response.json();

    // 初期化
    themeSelect.innerHTML = '<option value="">ジャンル選択</option>';

    // 取得したジャンル反映
    genres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre.genre_id;
      option.textContent = genre.genre_name;
      themeSelect.appendChild(option);
    });
  } catch (err) {
    console.error("ジャンル取得エラー:", err);
  }

  // プレイヤーリスト更新
  function updatePlayerList() {
    const rows = playerList.querySelectorAll(".player-row");
    const currentRows = rows.length;

    if (count > currentRows) {
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

  // プレイヤー登録
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const genre_id = document.getElementById("theme-select").value;
    if (!genre_id) {
      alert("ジャンルを選択してください");
      return;
    }

    //プレイヤー名取得
    const playerInputs = document.querySelectorAll(".player-row input[type='text']");
    const playerNames = Array.from(playerInputs).map((input, i) => input.value.trim() || `プレイヤー${i + 1}`);

    // 空欄チェック
    if (playerNames.some(name => name === "")) {
      alert("全てのプレイヤー名を入力してください");
      return;
    }

    try {
      console.log("テーマ取得開始");

      // テーマランダム取得
      const themeRes = await fetch(`http://10.75.63.165:3000/api/theme?genre_id=${genre_id}`);
      if (!themeRes.ok) throw new Error("テーマ取得失敗");
      const themeData = await themeRes.json();
      console.log("テーマ取得完了:", themeData);

      // プレイヤー登録
      console.log("プレイヤー登録");
      for (const name of playerNames) {
        const playerRes = await fetch("http://10.75.63.165:3000/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        if (!playerRes.ok) throw new Error("プレイヤー登録失敗");
        const playerData = await playerRes.json();
        console.log(`登録: ${playerData.name}`);
      }

      // 人狼決定
      console.log("人狼決定");
      const wolfRes = await fetch("http://10.75.63.165:3000/api/wolf", { method: "POST" });
      if (!wolfRes.ok) throw new Error("人狼決定失敗");
      const wolfData = await wolfRes.json();
      console.log("人狼決定:", wolfData);

      // テーマ割り当て
      console.log("テーマ割り当て");
      const postThemeRes = await fetch("http://10.75.63.165:3000/api/post-theme", { method: "POST" });
      if (!postThemeRes.ok) throw new Error("テーマ割り当て失敗");
      const assignedData = await postThemeRes.json();
      console.log("テーマ割り当て完了:", assignedData);

      alert("ゲーム準備完了！テーマを割り当てました");

      // ゲーム画面へ遷移
      window.location.href = "../check.html";

    } catch (err) {
      console.error("エラー:", err);
      alert("ゲーム開始中にエラーが発生しました。サーバーを確認してください。");
    }
  });
});