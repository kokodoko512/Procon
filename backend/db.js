const mysql = require('mysql2/promise');

// DB接続設定
const pool = mysql.createPool({
    host: '10.80.54.64',
    user: 'user556',      // ユーザー名
    password: '0922', // パスワード
    database: 'mw',     // 使用するデータベース名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;