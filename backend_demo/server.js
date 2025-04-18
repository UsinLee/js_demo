// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");

dotenv.config(); // .env 파일 로드

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어 등록
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // static 파일 제공 (프론트 연결용)

const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter); // http://localhost:포트/posts/create

const commentRoutes = require("./routes/comments");
app.use("/comments", commentRoutes);


// 테스트 라우트
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

