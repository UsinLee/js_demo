// db.js
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config(); // .env 파일 로딩

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// 연결 확인 함수
pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ DB 연결 실패", err.stack);
  }
  console.log("✅ PostgreSQL 연결 성공");
  release(); // 연결 해제
});

module.exports = pool;

