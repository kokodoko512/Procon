let currentPlayer = null;
let currentIndex = 0; // ←グローバルに宣言

async function loadCurrentPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    currentIndex = parseInt(urlParams.get("player")) || 0; // ←ここで代入

    try {
        const res = await fetch("http://localhost:3000/api/players");
        const players = await res.json();

        currentPlayer = players[currentIndex];

        if (!currentPlayer) {
            alert("プレイヤー情報が見つかりません");
            return null;
        }

        const playerName = currentPlayer.name;
        document.getElementById("player-question").textContent = `${playerName}さんですか？`;

        return currentPlayer;

    } catch (err) {
        console.error(err);
        alert("プレイヤー情報の取得に失敗しました");
        return [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCurrentPlayer();
});

document.getElementById("yes-button").addEventListener("click", () => {
    // currentIndex はグローバルなのでここで使える
    window.location.href = `select.html?player=${currentIndex}`;
});
