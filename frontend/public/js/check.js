
const urlParams = new URLSearchParams(window.location.search);
let currentIndex = parseInt(urlParams.get("player")) || 0;

const players = JSON.parse(localStorage.getItem("players") || "[]");

const currentPlayer = players[currentIndex];

const playerName = currentPlayer?.name || `プレイヤー${currentIndex+1}`;

document.getElementById("player-question").textContent = `${playerName}さんですか？`;

document.getElementById("yes-button").addEventListener("click", () => {
    // page1.html に現在のプレイヤーを渡す
    window.location.href = `select.html?player=${currentIndex}`;
});