const urlParams = new URLSearchParams(window.location.search);
const currentIndex = parseInt(urlParams.get("player")) || 0;
const players = JSON.parse(localStorage.getItem("players") || "[]");
const currentPlayer = players[currentIndex];

const playerName = currentPlayer?.name || `プレイヤー${currentIndex + 1}`;
const playerTheme = currentPlayer?.theme_name || `テーマ`;

document.getElementById("theme").textContent = `${playerName}さんのテーマは「${playerTheme}」です`;

let currentQuery = "";
let offset = 0;
const limit = 5;

// 検索ボタン
document.getElementById("search-btn").addEventListener("click", async () => {
    const query = document.getElementById("search").value.trim();
    if (!query) {
        alert("検索ワードを入力してください");
        return;
    }

    currentQuery = query;
    offset = 0;
    document.getElementById("search-results").innerHTML = "";
    await fetchTracks();
    });

    // もっと見るボタン
    document.getElementById("load-more").addEventListener("click", async () => {
    offset += limit;
    await fetchTracks();
    });

    // 曲検索＋表示
    async function fetchTracks() {
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

        // 曲リストを追加表示
        tracks.forEach(track => {
        const div = document.createElement("div");
        div.className = "track-item";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.margin = "8px 0";

        div.innerHTML = `
            <img src="${track.album_image}" alt="Album" class="album-img" style="width:60px; height:60px; margin-right:10px;">
            <div style="flex:1;">
            <strong>${track.title}</strong><br>
            <span>${track.artist}</span>
            </div>
        `;

        // 選択ボタンを追加
        const button = document.createElement("button");
        button.textContent = "選択";
        button.addEventListener("click", async () => {
            if (!confirm(`この曲を選択しますか？\n\n${track.title} - ${track.artist}`)) return;

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
            if (currentIndex + 1 < players.length) {
                window.location.href = `check.html?player=${currentIndex + 1}`;
            } else {
                window.location.href = "play.html";
            }
            } else {
            alert(result.error || "登録に失敗しました。");
            }
        });

        div.appendChild(button);
        list.appendChild(div);
        });

        // 曲が5件未満なら「もっと見る」を非表示
        document.getElementById("load-more").style.display =
        tracks.length < limit ? "none" : "block";

    } catch (err) {
        console.error(err);
        alert("検索中にエラーが発生しました");
    }
}
