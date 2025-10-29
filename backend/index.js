import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();


// DB接続設定
const db = await mysql.createConnection({
    host: '192.168.10.3',
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
app.post("/api/wolf", async (req, res) => {
    if (players.length === 0) {
        return res.status(400).json({ error: "プレイヤー未登録" });
    }

    try {
        // 全員を市民(false)に設定
        players.forEach(p => p.wolf = false);

        // ランダムで一人人狼(true)に設定
        const randomIndex = Math.floor(Math.random() * players.length);
        players[randomIndex].wolf = true;

        // DB に反映
        for (const p of players) {
            await db.execute("UPDATE PLAYER SET wolf = ? WHERE player_id = ?", [p.wolf, p.player_id]);
        }

        res.json({
            message: "人狼決定",
            players
        });

    } catch (err) {
        console.error("DB更新エラー:", err);
        res.status(500).json({ error: "人狼決定失敗" });
    }
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


// API:7.結果表示
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


// API:8.ゲーム初期化
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



// =========================
// Spotify
// =========================

// Spotify 認証トークン取得
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const data = await res.json();
    return data.access_token;
}


// API:Spotifyトークン取得
app.get("/api/spotify/token", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        res.json({ access_token: token });
    } catch (error) {
        console.error("Spotifyトークン取得エラー:", error);
        res.status(500).json({ error: "トークン取得失敗" });
    }
});


// API:Spotify曲検索
app.get("/api/spotify/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: "検索ワードを指定してください" });
        }

        const token = await getSpotifyToken();
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;

        const response = await fetch(searchUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();

        // 結果を整理して返す
        const tracks = data.tracks.items.map(item => ({
            spotify_id: item.id,
            title: item.name,
            artist: item.artists.map(a => a.name).join(", "),
            album: item.album.name,
            album_image: item.album.images[0]?.url || null,
            preview_url: item.preview_url
        }));

        res.json(tracks);

    } catch (error) {
        console.error("Spotify検索エラー:", error);
        res.status(500).json({ error: "検索失敗" });
    }
});


// API:Spotify曲を登録
app.post("/api/spotify/register-song", async (req, res) => {
    const { player_id, spotify_id } = req.body;

    if (!player_id || !spotify_id) {
        return res.status(400).json({ error: "player_idとspotify_idが必要です" });
    }

    try {
        // Spotifyトークン取得
        const token = await getSpotifyToken();

        // 曲情報をSpotify APIから取得
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${spotify_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const track = await trackRes.json();

        if (!track.name) {
            return res.status(404).json({ error: "Spotifyで曲が見つかりませんでした" });
        }

        // 曲情報をDBに登録
        const [songResult] = await db.execute(
            "INSERT INTO SONG (spotify_id, title, artist) VALUES (?, ?, ?)",
            [
                spotify_id,
                track.name,
                track.artists.map(a => a.name).join(", ")
            ]
        );

        const songId = songResult.insertId;

        // PLAYERテーブル更新
        await db.execute(
            "UPDATE PLAYER SET song_id = ? WHERE player_id = ?",
            [songId, player_id]
        );

        // メモリ上のプレイヤー情報も更新
        players = players.map(p =>
            p.player_id === player_id ? { ...p, song_id: songId } : p
        );

        res.json({
            message: "Spotify曲登録完了",
            song: {
                song_id: songId,
                spotify_id,
                title: track.name,
                artist: track.artists.map(a => a.name).join(", "),
                player_id
            }
        });

    } catch (error) {
        console.error("Spotify曲登録エラー:", error);
        res.status(500).json({ error: "Spotify曲登録失敗" });
    }
});


// 登録順でSpotify曲を再生するAPI
app.post("/api/spotify/play/all", async (req, res) => {
    const { access_token, device_id } = req.body;

    if (!access_token) {
        return res.status(400).json({ error: "access_token が必要です" });
    }

    try {
        // 登録順（player_id 昇順）に曲取得
        const [songs] = await db.query(
            `SELECT s.spotify_id, s.title, s.artist, p.name AS player_name
            FROM PLAYER p
            JOIN SONG s ON p.song_id = s.song_id
            ORDER BY p.player_id`
        );

        if (!songs || songs.length === 0) {
            return res.status(404).json({ error: "登録されている曲がありません" });
        }

        // SpotifyトラックURIに変換
        const uris = songs
            .filter(s => s.spotify_id) // spotify_idがあるものだけ再生
            .map(s => `spotify:track:${s.spotify_id}`);

        if (uris.length === 0) {
            return res.status(400).json({ error: "再生可能なSpotify曲がありません" });
        }

        // Spotify再生リクエスト
        const playUrl = `https://api.spotify.com/v1/me/player/play${device_id ? `?device_id=${device_id}` : ""}`;
        const response = await fetch(playUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ uris })
        });

        if (response.status === 204) {
            console.log("登録順の曲をSpotifyで再生開始");
            return res.json({
                message: "登録順の曲を再生開始しました",
                songs
            });
        } else {
            const errorData = await response.json();
            console.error("Spotify再生エラー:", errorData);
            return res.status(response.status).json({
                error: "Spotify再生失敗",
                details: errorData
            });
        }

    } catch (error) {
        console.error("Spotify再生エラー:", error);
        res.status(500).json({ error: "サーバーエラーで再生できませんでした" });
    }
});



// サーバー起動
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
