document.addEventListener("DOMContentLoaded", async () => {
  const voteList = document.getElementById("vote-list");
  const finishBtn = document.getElementById("finish-vote");

  let players = [];
  let songs = [];

  try {
    // プレイヤー一覧取得
    const resPlayers = await fetch("https://procon-e8vw.onrender.com/api/players");
    players = await resPlayers.json();

    // 曲一覧取得
    const resSongs = await fetch("https://procon-e8vw.onrender.com/api/youtube/songs");
    songs = await resSongs.json();

    if (!players || players.length === 0) {
      alert("プレイヤー情報が取得できません");
      return;
    }
  } catch (err) {
    console.error(err);
    alert("情報の取得に失敗しました");
    return;
  }

  // 投票数を格納
  const votes = new Array(players.length).fill(0);

  // プレイヤーごとにUI作成
  players.forEach((player, index) => {
    const song = songs.find(s => s.player_id === player.player_id);
    const songTitle = song ? song.title : "（曲未登録）";
    const thumbnail = song
      ? song.album_image || `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`
      : "https://via.placeholder.com/120x90?text=No+Image";

    const row = document.createElement("div");
    row.classList.add("vote-row");
    row.innerHTML = `
      <div class="player-info">
        <img src="${thumbnail}" alt="thumbnail">
        <div>
          <span class="player-name">${player.name}</span><br>
          <span class="song-title">${songTitle}</span>
        </div>
      </div>
      <div class="vote-controls">
        <button class="decrease" data-index="${index}">-</button>
        <span class="vote-count" id="vote-${index}">0</span>
        <button class="increase" data-index="${index}">+</button>
      </div>
    `;
    voteList.appendChild(row);
  });

  // 投票合計計算関数
  const getTotalVotes = () => votes.reduce((a, b) => a + b, 0);

  // UI更新関数
  const updateUI = () => {
    const total = getTotalVotes();
    const maxVotes = players.length;

    votes.forEach((v, i) => {
      document.getElementById(`vote-${i}`).textContent = v;
    });

    if (total === maxVotes) {
      finishBtn.classList.remove("disabled");
    } else {
      finishBtn.classList.add("disabled");
    }

    document.querySelectorAll(".increase").forEach(btn => {
      btn.disabled = total >= maxVotes;
    });
  };

  // 投票ボタン処理
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

    if (totalVotes !== playerCount) {
      alert(`投票数の合計が${playerCount}人分になるようにしてください。`);
      return;
    }

    const maxVotes = Math.max(...votes);
    const wolfIndex = votes.indexOf(maxVotes);
    const wolfId = players[wolfIndex].player_id;

    const realWolf = players.find(p => p.wolf === true);
    const realWolfId = realWolf ? realWolf.player_id : null;

    if (wolfId === realWolfId) {
      window.location.href = "citizen_win.html";
    } else {
      window.location.href = "wolf_win.html";
    }
  });
});
