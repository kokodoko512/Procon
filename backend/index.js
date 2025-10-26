import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

// ================================
// DB接続設定
// ================================
const db = await mysql.createConnection({
    host: 'localhost',
    user: 'user556',
    password: '0922',
    database: 'mw'
});

// ================================
// Express 設定
// ================================
const app = express();
app.use(cors());
app.use(express.json());

// ================================
// 動作確認用ルート
// ================================
app.get("/", (req, res) => {
    res.send("Music Werewolf API is running!");
});


// ================================
// サーバー起動
// ================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
