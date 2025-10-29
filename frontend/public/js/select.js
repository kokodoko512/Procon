let currentPlayer = null;
let currentQuery = "";
let offset = 0;
const limit = 10;

// プレイヤー情報をAPIから取得して表示
async function loadPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentIndex = parseInt(urlParams.get("player")) || 0;

    try {
        const res = await fetch("http://localhost:3000/api/players");
        const players = await res.json();
        currentPlayer = players[currentIndex];

        if (!currentPlayer) {
            alert("プレイヤー情報が見つかりません");
            return null;
        }

        const playerName = currentPlayer.name;
        const playerTheme = currentPlayer.theme_name || "テーマ未設定";

        document.getElementById("theme").textContent =
            `${playerName}さんのテーマは「${playerTheme}」です`;

        return currentPlayer;

    } catch (err) {
        console.error(err);
        alert("プレイヤー情報の取得に失敗しました");
        return null;
    }
}

// 曲検索＋表示
async function fetchTracks() {
    if (!currentPlayer) return;

    try {
        const response = await fetch(
            `http://localhost:3000/api/spotify/search?q=${encodeURIComponent(currentQuery)}&limit=${limit}&offset=${offset}`
        );

        const tracks = await response.json();

        const list = document.getElementById("search-results");

        if (!tracks.length && offset === 0) {
            list.innerHTML = "<p>該当する曲が見つかりませんでした。</p>";
            document.getElementById("load-more").style.display = "none";
            return;
        }

        tracks.forEach(track => {
            const div = document.createElement("div");
            div.className = "track-item";
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.margin = "8px 0";

            div.innerHTML = `
                <img src="${track.album_image || ""}" alt="Album" class="album-img" style="width:60px; height:60px; margin-right:10px;">
                <div style="flex:1;">
                    <strong>${track.title}</strong><br>
                    <span>${track.artist}</span>
                </div>
            `;

            const button = document.createElement("button");
            button.textContent = "選択";
            button.addEventListener("click", async () => {
                if (!confirm(`この曲を選択しますか？\n\n${track.title} - ${track.artist}`)) return;

                try {
                    const res = await fetch("http://localhost:3000/api/spotify/register-song", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            player_id: currentPlayer.player_id,
                            spotify_id: track.spotify_id
                        })
                    });

                    const result = await res.json();

                    if (res.ok) {
                        alert("曲を登録しました！");
                        // 次のプレイヤーへ
                        const urlParams = new URLSearchParams(window.location.search);
                        const nextIndex = parseInt(urlParams.get("player")) + 1;

                        const playersRes = await fetch("http://localhost:3000/api/players");
                        const players = await playersRes.json();

                        if (nextIndex < players.length) {
                            window.location.href = `check.html?player=${nextIndex}`;
                        } else {
                            window.location.href = "play.html";
                        }

                    } else {
                        alert(result.error || "登録に失敗しました。");
                    }

                } catch (err) {
                    console.error(err);
                    alert("曲登録中にエラーが発生しました");
                }
            });

            div.appendChild(button);
            list.appendChild(div);
        });

        document.getElementById("load-more").style.display =
            tracks.length < limit ? "none" : "block";

    } catch (err) {
        console.error(err);
        alert("曲検索中にエラーが発生しました");
    }
}

// 検索ボタン
document.getElementById("search-btn").addEventListener("click", async () => {
    const query = document.getElementById("search").value.trim();
    if (!query) return alert("検索ワードを入力してください");

    currentQuery = query;
    offset = 0;
    document.getElementById("search-results").innerHTML = "";

    await loadPlayer();
    await fetchTracks();
});

// もっと見るボタン
document.getElementById("load-more").addEventListener("click", async () => {
    offset += limit;
    await fetchTracks();
});

// 初期ロード時にプレイヤー情報だけ取得
loadPlayer();
