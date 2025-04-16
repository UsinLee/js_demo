const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db"); // db/index.js에 있는 pg pool 객체
const router = express.Router();
const jwt = require("jsonwebtoken");

// 회원가입
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 아이디 중복 확인
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 정보 저장
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    );

    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 🔐 로그인 라우트
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const client = await pool.connect();

    const result = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
    }

    // ✅ JWT 발급
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // 1시간짜리 토큰
    );

    return res.json({
      message: "로그인 성공",
      token, // 👈 토큰을 클라이언트에 전달
    });

  } catch (err) {
    console.error("로그인 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});


module.exports = router;
