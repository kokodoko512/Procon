document.addEventListener("DOMContentLoaded", async () => {
  const countDisplay = document.getElementById("player-count");
  const decreaseBtn = document.querySelector('button[data-action="decrease"]');
  const increaseBtn = document.querySelector('button[data-action="increase"]');
  const playerList = document.querySelector(".play-list");
  const form = document.getElementById("players-form");
  const themeSelect = document.getElementById("theme-select"); // ← ★ジャンルセレクト取得


  let count = 4; // 初期人数

  // 🎯 ① ジャンル一覧をDBから取得して反映
  try {
    const response = await fetch("http://localhost:3000/api/genres");
    if (!response.ok) throw new Error("ジャンル取得に失敗しました");
    const genres = await response.json();

    // 一旦初期化
    themeSelect.innerHTML = '<option value="">ジャンル選択</option>';

    // DBから取得したジャンルを反映
    genres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre.genre_id;
      option.textContent = genre.genre_name;
      themeSelect.appendChild(option);
    });
  } catch (err) {
    console.error("ジャンル取得エラー:", err);
  }

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

    const genre_id = document.getElementById("theme-select").value;
    if (!genre_id) {
      alert("ジャンルを選択してください。");
      return;
    }

    //プレイヤー名を取得
    const playerInputs = document.querySelectorAll(".player-row input[type='text']");
    const playerNames = Array.from(playerInputs).map((input, i) => input.value.trim() || `プレイヤー${i + 1}`);

    // 空欄チェック
    if (playerNames.some(name => name === "")) {
      alert("全てのプレイヤー名を入力してください！");
      return;
    }

    try {
      console.log("🎬 ステップ1：テーマ取得開始");

    // ① テーマをランダム取得
    const themeRes = await fetch(`http://localhost:3000/api/theme?genre_id=${genre_id}`);
    if (!themeRes.ok) throw new Error("テーマ取得失敗");
    const themeData = await themeRes.json();
    console.log("✅ テーマ取得完了:", themeData);

    // ② プレイヤー登録
    console.log("🎬 ステップ2：プレイヤー登録");
    for (const name of playerNames) {
      const playerRes = await fetch("http://localhost:3000/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!playerRes.ok) throw new Error("プレイヤー登録失敗");
      const playerData = await playerRes.json();
      console.log(`✅ 登録: ${playerData.name}`);
    }

    // ③ 人狼決定
    console.log("🎬 ステップ3：人狼決定");
    const wolfRes = await fetch("http://localhost:3000/api/wolf", { method: "POST" });
    if (!wolfRes.ok) throw new Error("人狼決定失敗");
    const wolfData = await wolfRes.json();
    console.log("✅ 人狼決定:", wolfData);

    // ④ テーマ割り当て
    console.log("🎬 ステップ4：テーマ割り当て");
    const postThemeRes = await fetch("http://localhost:3000/api/post-theme", { method: "POST" });
    if (!postThemeRes.ok) throw new Error("テーマ割り当て失敗");
    const assignedData = await postThemeRes.json();
    console.log("✅ テーマ割り当て完了:", assignedData);

    alert("ゲーム準備完了！テーマを割り当てました。");

    // ⑤ ゲーム画面へ遷移（例）
    window.location.href = "../check.html";

  } catch (err) {
    console.error("❌ エラー:", err);
    alert("ゲーム開始中にエラーが発生しました。サーバーを確認してください。");
  }
});
});