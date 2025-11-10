document.querySelector(".create-btn").addEventListener("click", async() => {
  const clickSound = new Audio("sound/btn.mp3");
  clickSound.volume = 0.8;
  clickSound.play().catch((e) => {
    console.warn("サウンドの再生ブロック", e);
  });
  
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
    setTimeout(() => {
      window.location.href = "room.html";
    }, 500);

  } catch (error) {
    console.error("初期化失敗:", error);
    alert("ゲームの初期化に失敗しました。サーバーを確認してください。");
  }
});
