// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// 정적 파일 서빙 (public/index.html 등)
app.use(express.static(path.join(__dirname, "public")));

// 라우트 연결
const testRouter = require("./routes/test");
app.use("/api/test", testRouter);

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
