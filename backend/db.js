const mysql = require('mysql2/promise');

// DB接続設定（あなたのユーザー名・パスワードに変更）
const pool = mysql.createPool({
  host: 'localhost',
  user: 'user556',      // または root
  password: '0922', // あなたの設定したパスワード
  database: 'djdb',     // 使用するデータベース名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
