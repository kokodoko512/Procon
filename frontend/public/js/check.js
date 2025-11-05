let currentPlayer = null;
let currentIndex = 0;

async function loadCurrentPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    currentIndex = parseInt(urlParams.get("player")) || 0;

    try {
        const res = await fetch("http://10.75.63.165:3000/api/players");
        const players = await res.json();

        currentPlayer = players[currentIndex];

        if (!currentPlayer || currentIndex >= players.length) {
            alert("プレイヤー情報が見つかりません");
            return null;
        }

        const playerName = currentPlayer.name;
        document.getElementById("player-question").textContent = `${playerName}さんですか？`;

        return currentPlayer;

    } catch (err) {
        console.error(err);
        alert("プレイヤー情報取得失敗");
        return [];
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const currentPlayer = await loadCurrentPlayer();
    if(!currentPlayer) return;
});

document.getElementById("yes-button").addEventListener("click", () => {
    window.location.href = `select.html?player=${currentIndex}`;
});
