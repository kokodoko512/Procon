import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 5173;

// __dirnameを定義（ESモジュール対応）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// publicフォルダを静的配信
app.use(express.static(path.join(__dirname, "public")));

// ルートURLにアクセスしたとき start.html を返す
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "start.html"));
});

// サーバー起動
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
