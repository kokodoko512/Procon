document.addEventListener("DOMContentLoaded", async () => {
  const voteList = document.getElementById("vote-list");
  const finishBtn = document.getElementById("finish-vote");

  let players = [];
  try {
    // プレイヤー一覧取得
    const res = await fetch("https://procon-e8vw.onrender.com/api/players");
    players = await res.json();

    if (!players || players.length === 0) {
      alert("プレイヤー情報が取得できません");
      return;
    }
  } catch (err) {
    console.error(err);
    alert("プレイヤー情報の取得に失敗しました");
    return;
  }

  // 投票数を格納
  const votes = new Array(players.length).fill(0);

  // プレイヤーごとにUI作成
  players.forEach((player, index) => {
    const row = document.createElement("div");
    row.classList.add("vote-row");
    row.innerHTML = `
      <span class="player-name">${player.name}</span>
      <button class="decrease" data-index="${index}">-</button>
      <span class="vote-count" id="vote-${index}">0</span>
      <button class="increase" data-index="${index}">+</button>
    `;
    voteList.appendChild(row);
  });

 // 投票合計計算関数
  const getTotalVotes = () => votes.reduce((a, b) => a + b, 0);

  // ボタン有効・無効制御
  const updateUI = () => {
    const total = getTotalVotes();
    const maxVotes = players.length; // 合計＝人数

    // 投票数表示更新
    votes.forEach((v, i) => {
      document.getElementById(`vote-${i}`).textContent = v;
    });

    // 合計が人数→「決定する」ボタン有効化
    if (total === maxVotes) {
      finishBtn.classList.remove("disabled");
    } else {
      finishBtn.classList.add("disabled");
    }

    // 増減制御
    document.querySelectorAll(".increase").forEach(btn => {
      btn.disabled = total >= maxVotes; // これ以上増やせない
    });

  };


  // 投票増減ボタン処理
  voteList.addEventListener("click", (e) => {
    if (e.target.classList.contains("increase") || e.target.classList.contains("decrease")) {
      const index = parseInt(e.target.dataset.index);
      if (e.target.classList.contains("increase")) {
        votes[index]++;
      } else if (e.target.classList.contains("decrease") && votes[index] > 0) {
        votes[index]--;
      }
      updateUI();
    }
  });

  // 投票完了ボタン
  finishBtn.addEventListener("click", () => {
    const totalVotes = votes.reduce((sum, v) => sum + v, 0);
    const playerCount = players.length;

    // 合計投票数≠プレイヤー人数警告
    if (totalVotes !== playerCount) {
      alert(`投票数の合計が${playerCount}人分になるようにしてください。`);
      return;
    }

    // 最多得票プレイヤー特定
    const maxVotes = Math.max(...votes);
    const wolfIndex = votes.indexOf(maxVotes);
    const wolfId = players[wolfIndex].player_id;
    console.log("投票で最多票のプレイヤー:", wolfId);

    // 人狼特定
    const realWolf = players.find(p => p.wolf === true);
    console.log("本物の人狼:", realWolf);
    const realWolfId = realWolf ? realWolf.player_id : null;

    // 効果音再生
    const clickSound = new Audio("sound/btn.mp3");
    clickSound.volume = 0.8;
    clickSound.play().catch((e) => {
      console.warn("サウンドの再生ブロック", e);
    });

    // 勝敗判定・遷移
    setTimeout(() => {
      if (wolfId === realWolfId) {
        window.location.href = "citizen_win.html";
      } else {
        window.location.href = "wolf_win.html";
      }
    }, 1000);
  });
});