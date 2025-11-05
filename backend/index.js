import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import db from "./db.js"; // ← db.jsを読み込む

dotenv.config();

// =========================
// Express設定
// =========================
const app = express();
app.use(cors({
    origin: [
        "https://frontend-2x0t.onrender.com", // フロントのURL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// 動作確認
app.get("/", (req, res) => {
    res.send("Music Werewolf API is running!");
});



// =========================
// API設定
// =========================

// 1.ジャンル一覧取得
app.get("/api/genres", async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT genre_id, genre_name FROM GENRE");
        res.json(rows);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "サーバーエラー発生" });
    }
});

// 2.テーマランダム取得
let currentTheme = null;

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

        currentTheme = rows[0];
        res.json(rows[0]);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "サーバーエラー発生" });
    }
});

// 3.プレイヤー登録
let players = [];
let nextPlayerId = 1;

app.post("/api/players", async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "名前を入力してください。" });
    }

    try {
        const [result] = await db.execute("INSERT INTO PLAYER (name) VALUES (?)", [name]);

        const newPlayer = {
            player_id: result.insertId,
            name,
            wolf: null,
            theme_name: null,
            song_id: null,
        };

        players.push(newPlayer);
        res.json(newPlayer);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "プレイヤー登録失敗" });
    }
});

// 4.プレイヤー一覧取得
app.get("/api/players", (req, res) => {
    res.json(players);
});

// 5.人狼決定
app.post("/api/wolf", async (req, res) => {
    if (players.length === 0) {
        return res.status(400).json({ error: "プレイヤー未登録" });
    }

    try {
        players.forEach((p) => (p.wolf = false));
        const randomIndex = Math.floor(Math.random() * players.length);
        players[randomIndex].wolf = true;

        for (const p of players) {
            await db.execute("UPDATE PLAYER SET wolf = ? WHERE player_id = ?", [p.wolf, p.player_id]);
        }

        res.json({ message: "人狼決定", players });
    } catch (err) {
        console.error("DB更新エラー:", err);
        res.status(500).json({ error: "人狼決定失敗" });
    }
});

// 6.テーマ割り当て
app.post("/api/post-theme", (req, res) => {
    if (!currentTheme) {
        return res.status(400).json({ error: "テーマ未選択" });
    }
    if (players.length === 0) {
        return res.status(400).json({ error: "プレイヤー未登録" });
    }

    const { theme_id, citizen_theme, wolf_theme } = currentTheme;
    players = players.map((p) => ({
        ...p,
        theme_name: p.wolf ? wolf_theme : citizen_theme,
    }));

    res.json({
        message: "テーマ割当完了",
        theme_id,
        assigned: players,
    });
});

// 7.結果表示
app.get("/api/result", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                p.player_id,
                p.name,
                p.wolf,
                s.title,
                s.youtube_id,
                s.album_image
            FROM PLAYER p
            LEFT JOIN SONG s ON p.song_id = s.song_id
            ORDER BY p.player_id
        `);

        // players 配列からテーマ名を結合
        const results = rows.map(player => {
            const memPlayer = players.find(p => p.player_id === player.player_id);
            return {
                ...player,
                theme_name: memPlayer ? memPlayer.theme_name : null
            };
        });

        res.json(results);

    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ message: "結果取得失敗" });
    }
});

// 8.ゲーム初期化
app.post("/api/reset-game", async (req, res) => {
    try {
        await db.execute("DELETE FROM PLAYER");
        await db.execute("DELETE FROM SONG");
        await db.execute("ALTER TABLE SONG AUTO_INCREMENT = 1");
        await db.execute("ALTER TABLE PLAYER AUTO_INCREMENT = 1");

        players = [];
        nextPlayerId = 1;

        res.json({ message: "ゲームデータ初期化" });
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ error: "初期化失敗" });
    }
});


// =========================
// YouTubeAPI設定
// =========================

// YouTube検索API
app.get("/api/youtube/search", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "検索ワードを指定してください" });

    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
        query
    )}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const videos = data.items.map((item) => ({
            youtube_id: item.id.videoId,
            title: item.snippet.title,
            album_image: item.snippet.thumbnails.medium.url,
        }));

        res.json(videos);
    } catch (err) {
        console.error("YouTube検索エラー:", err);
        res.status(500).json({ error: "検索失敗" });
    }
});

// 曲登録API
app.post("/api/youtube/register-song", async (req, res) => {
    const { player_id, youtube_id, title, album_image } = req.body;

    if (!player_id || !youtube_id || !title) {
        return res.status(400).json({ error: "player_id, youtube_id, title は必須です" });
    }

    try {
        // 曲を登録
        const [result] = await db.execute(
            "INSERT INTO SONG (youtube_id, title, album_image) VALUES (?, ?, ?)",
            [youtube_id, title, album_image]
        );

        const songId = result.insertId;

        // プレイヤーに紐づけ
        await db.execute(
            "UPDATE PLAYER SET song_id = ? WHERE player_id = ?",
            [songId, player_id]
        );

        res.json({ message: "曲登録完了", song_id: songId });
    } catch (error) {
        console.error("登録エラー:", error);
        res.status(500).json({ error: "登録失敗" });
    }
});

// 登録順に曲を取得
app.get("/api/youtube/songs", async (req, res) => {
    try {
        const [songs] = await db.query(`
            SELECT s.youtube_id, s.title, s.album_image, p.name AS player_name
            FROM PLAYER p
            JOIN SONG s ON p.song_id = s.song_id
            ORDER BY p.player_id
        `);
        res.json(songs);
    } catch (error) {
        console.error("DBエラー:", error);
        res.status(500).json({ error: "取得失敗" });
    }
});


// =========================
// サーバー起動
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

