let currentPlayer = null;
let currentQuery = "";
let nextPageToken = "";
const apiKey = "AIzaSyCkiZDUv6Pz9CPb2wiwUiyqtHqddFlm93Y"; // YouTube APIキー
const limit = 10;


// プレイヤー情報を取得してテーマ表示
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


// YouTubeで動画検索
async function fetchVideos(isLoadMore = false) {
    if (!currentPlayer) return;
    const list = document.getElementById("search-results");

    try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("type", "video");
        url.searchParams.set("q", currentQuery);
        url.searchParams.set("maxResults", limit);
        url.searchParams.set("key", apiKey);
        if (isLoadMore && nextPageToken) {
        url.searchParams.set("pageToken", nextPageToken);
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!isLoadMore) list.innerHTML = "";

        if (!data.items || data.items.length === 0) {
        if (!isLoadMore)
            list.innerHTML = "<p>該当する動画が見つかりませんでした。</p>";
        document.getElementById("load-more").style.display = "none";
        return;
        }

        data.items.forEach((video) => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumbnail = video.snippet.thumbnails.default.url;

        const div = document.createElement("div");
        div.className = "track-item";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.margin = "8px 0";

        div.innerHTML = `
            <img src="${thumbnail}" alt="Thumbnail" style="width:80px; height:80px; margin-right:10px;">
            <div style="flex:1;">
            <strong>${title}</strong>
            </div>
        `;

        const button = document.createElement("button");
        button.textContent = "選択";
        button.addEventListener("click", async () => {
            if (!confirm(`この曲を選択しますか？\n\n${title}`)) return;

            try {
            const res = await fetch("http://localhost:3000/api/youtube/register-song", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    player_id: currentPlayer.player_id,
                    youtube_id: videoId,
                    title: title,
                    album_image: thumbnail
                }),
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

        nextPageToken = data.nextPageToken || "";
        document.getElementById("load-more").style.display = nextPageToken ? "block" : "none";
    } catch (err) {
        console.error(err);
        alert("動画検索中にエラーが発生しました");
    }
}


// 検索ボタン
document.getElementById("search-btn").addEventListener("click", async () => {
    const query = document.getElementById("search").value.trim();
    if (!query) return alert("検索ワードを入力してください");

    currentQuery = query;
    nextPageToken = "";
    await loadPlayer();
    await fetchVideos(false);
});


// もっと見るボタン
document.getElementById("load-more").addEventListener("click", async () => {
    await fetchVideos(true);
});


// 初期ロード
loadPlayer();
