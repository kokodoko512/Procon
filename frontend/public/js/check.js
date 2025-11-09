let currentPlayer = null;
let currentIndex = 0;

async function loadCurrentPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    currentIndex = parseInt(urlParams.get("player")) || 0;

    try {
        const res = await fetch("https://procon-e8vw.onrender.com/api/players");
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

document.getElementById("yes-btn").addEventListener("click", () => {
    const clickSound = new Audio("sound/btn.mp3");
    clickSound.volume = 0.8;
    clickSound.play().catch((e) => {
        console.warn("サウンドの再生ブロック", e);
    });
    
    setTimeout(() => {
        window.location.href = `select.html?player=${currentIndex}`;
    }, 350);
});
