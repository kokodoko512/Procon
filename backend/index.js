// 依存モジュール読み込み
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // MySQL接続プール

const app = express();
const port = 3000;

// JSONデータを扱う設定
app.use(express.json());

// CORS対応
app.use(cors({
    origin: 'http://localhost:5173', // Vueの開発サーバーURL
    credentials: true, // Cookieや認証情報を扱う場合はtrue
}));

// 動作確認用ルート
app.get('/', (req, res) => {
    res.send('Hello from Node.js Backend!');
});

// API例：MySQLからusersテーブルのデータを取得
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// サーバー起動
app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
