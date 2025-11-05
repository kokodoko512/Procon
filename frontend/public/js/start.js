document.querySelector(".create-btn").addEventListener("click", async() => {
  try {
    // APIにPOSTリクエスト送信
    const response = await fetch("https://procon-e8vw.onrender.com/api/reset-game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("サーバーエラー");
    }

    const data = await response.json();
    console.log(data.message);

    // room.htmlに遷移
    window.location.href = "room.html";

  } catch (error) {
    console.error("初期化失敗:", error);
    alert("ゲームの初期化に失敗しました。サーバーを確認してください。");
  }
});
