let player;
let playlist = [];
let songs = [];
let currentIndex = 0;

// YouTubeプレイヤー準備
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: "",
    events: {
      onStateChange: onPlayerStateChange
    }
  });

  loadSongs();
}

// 曲リスト取得
async function loadSongs() {
  try {
    const res = await fetch("https://procon-e8vw.onrender.com/api/youtube/songs");
    songs = await res.json();
    playlist = songs.map(s => s.youtube_id);

    const container = document.getElementById("song-list");
    container.innerHTML = "";

    songs.forEach((s, index) => {
      const div = document.createElement("div");
      div.className = "song-item";
      div.style.marginBottom = "10px";
      div.innerHTML = `
        <img src="${s.album_image || `https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`}" 
            alt="thumbnail" width="120" height="90" style="margin-right:10px;vertical-align:middle;">
        <strong>${s.title}</strong>（${s.player_name}さん）
      `;

      // 個別再生ボタン
      const btn = document.createElement("button");
      btn.textContent = "この曲を再生";
      btn.addEventListener("click", () => playSong(index));
      div.appendChild(btn);

      container.appendChild(div);
    });

  } catch (err) {
    console.error("曲読み込みエラー:", err);
  }
}

// 曲再生関数
function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const song = songs[currentIndex];
  player.loadVideoById(song.youtube_id);
  updateNowPlaying(song);
}

// 再生中タイトル更新
function updateNowPlaying(song) {
  const nowPlaying = document.getElementById("now-playing");
  nowPlaying.textContent = `再生中: ${song.title}（${song.player_name}さん）`;
}

// 再生終了イベント
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    currentIndex++;
    if (currentIndex < playlist.length) {
      playSong(currentIndex);
    } else {
      document.getElementById("now-playing").textContent = "全曲再生が終了しました。";
    }
  }
}

// 全曲再生ボタン
document.getElementById("play-all-btn").addEventListener("click", () => {
  if (playlist.length > 0) {
    playSong(0);
  } else {
    alert("再生できる曲がありません");
  }
});

// 「人狼当てへ」ボタン押下時 vote.html へ遷移
document.getElementById("next-btn").addEventListener("click", () => {
  const clickSound = new Audio("sound/btn.mp3");
  clickSound.volume = 0.8;
  clickSound.play().catch((e) => {
    console.warn("サウンドの再生ブロック", e);
  });
  
  setTimeout(() => {
    window.location.href = "vote.html";
  }, 700);
});
