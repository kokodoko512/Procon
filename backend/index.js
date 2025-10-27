import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";


// DB接続設定
const db = await mysql.createConnection({
    host: 'localhost',
    user: 'user556',
    password: '0922',
    database: 'mw'
});

// Express 設定
const app = express();
app.use(cors());
app.use(express.json());

// 動作確認用ルート
app.get("/", (req, res) => {
    res.send("Music Werewolf API is running!");
});



// API:1.ジャンル一覧取得
app.get("/api/genres", async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT genre_id, genre_name FROM GENRE");
        res.json(rows);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "サーバーエラー発生" });
    }
});


// テーマ保持
let currentTheme = null;

// API:2.テーマランダム取得
app.get("/api/theme", async (req, res) => {
    try {
        const genreId = req.query.genre_id;
        let sql = "SELECT theme_id, citizen_theme, wolf_theme FROM THEME";
        const params = [];

        if (genreId) {
            sql += " WHERE genre_id = ?";
            params.push(genreId);
        }

        sql += " ORDER BY RAND() LIMIT 1";
        const [rows] = await db.execute(sql, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: "テーマなし" });
        }

        // テーマをメモリ保存
        currentTheme = rows[0];

        res.json(rows[0]);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "サーバーエラー発生" });
    }
});



// プレイヤー情報一時的保存
let players = [];
let nextPlayerId = 1; // 自動採番用

// API:3.プレイヤー登録
app.post("/api/players", async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "名前を入力してください。" });
    }

    try {
        // DBに登録
        const [result] = await db.execute(
            "INSERT INTO PLAYER (name) VALUES (?)",
            [name]
        );

        const newPlayer = {
            player_id: result.insertId,
            name,
            wolf: null,
            theme_name: null,
            song_id: null
        };

        // メモリに保存
        players.push(newPlayer);

        res.json(newPlayer);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "プレイヤー登録失敗" });
    }
});


// API:4.プレイヤー一覧取得
app.get("/api/players", (req, res) => {
    res.json(players);
});


// API:5.人狼決定
app.post("/api/wolf", (req, res) => {
    if (players.length === 0) {
        return res.status(400).json({ error: "プレイヤー未登録" });
    }

    // 市民(false)に初期化
    players.forEach(p => p.wolf = false);

    // ランダムで一人人狼(true)に設定
    const randomIndex = Math.floor(Math.random() * players.length);
    players[randomIndex].wolf = true;

    res.json({
        message: "人狼決定",
        players
    });
});


// API:6.テーマ割り当て
app.post("/api/post-theme", (req, res) => {
    if (!currentTheme) {
        return res.status(400).json({ error: "テーマ未選択" });
    }

    if (players.length === 0) {
        return res.status(400).json({ error: "プレイヤー未登録" });
    }

    // currentTheme使用
    const { theme_id, citizen_theme, wolf_theme } = currentTheme;

    // プレイヤーごとにテーマ割り当て
    players = players.map(p => ({
        ...p,
        theme_name: p.wolf ? wolf_theme : citizen_theme
    }));

    res.json({
        message: "テーマ割当完了",
        theme_id,
        assigned: players
    });
});



// API:7.曲登録
app.post("/api/songs", async (req, res) => {
    const { player_id, spotify_id, title, artist } = req.body;

    if (!player_id || !title || !artist) {
        return res.status(400).json({ error: "必要な情報不足" });
    }

    try {
        // 曲情報挿入
        const [songResult] = await db.execute(
            "INSERT INTO SONG (spotify_id, title, artist) VALUES (?, ?, ?)",
            [spotify_id || null, title, artist]
        );

        const songId = songResult.insertId;

        // PLAYERテーブルのsong_id更新
        await db.execute(
            "UPDATE PLAYER SET song_id = ? WHERE player_id = ?",
            [songId, player_id]
        );

        // メモリ上のplayers配列更新
        players = players.map(p =>
            p.player_id === player_id ? { ...p, song_id: songId } : p
        );

        res.json({
            message: "曲登録完了",
            song: {
                song_id: songId,
                spotify_id,
                title,
                artist,
                player_id
            }
        });
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ error: "曲登録失敗" });
    }
});



// API:8.結果表示
app.get("/api/result", async (req, res) => {
    try {
        if (players.length === 0) {
            return res.status(404).json({ message: "プレイヤー未登録" });
        }

        // プレイヤー配列をもとにDBから曲情報補完
        const results = [];
        for (const p of players) {
            let songData = null;

            if (p.song_id) {
                const [rows] = await db.query(
                    "SELECT title, artist FROM SONG WHERE song_id = ?",
                    [p.song_id]
                );
                songData = rows[0] || null;
            }

            results.push({
                player_id: p.player_id,
                name: p.name,
                wolf: p.wolf,
                theme_name: p.theme_name,
                title: songData?.title || null,
                artist: songData?.artist || null
            });
        }

        res.json(results);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "結果取得失敗" });
    }
});


// API:9.ゲーム初期化
app.post("/api/reset-game", async (req, res) => {
    try {
        // テーブル内容削除
        await db.execute("DELETE FROM SONG");
        await db.execute("DELETE FROM PLAYER");

        // AUTO_INCREMENTリセット
        await db.execute("ALTER TABLE SONG AUTO_INCREMENT = 1");
        await db.execute("ALTER TABLE PLAYER AUTO_INCREMENT = 1");

        // メモリ上のplayers配列リセット
        players = [];
        nextPlayerId = 1;

        res.json({ message: "ゲームデータ初期化" });
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ error: "初期化失敗" });
    }
});


// サーバー起動
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
