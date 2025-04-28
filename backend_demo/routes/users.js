const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db"); // db/index.js에 있는 pg pool 객체
const router = express.Router();
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middlewares/auth');

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
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
    }

    // Access Token (짧은 유효기간)
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Refresh Token (긴 유효기간)
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔐 Refresh Token을 DB에 저장
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, refresh_token, created_at) VALUES ($1, $2, NOW())",
      [user.id, refreshToken]
    );

    return res.json({
      message: "로그인 성공",
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username }
    });

  } catch (err) {
    console.error("로그인 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "리프레시 토큰이 필요합니다." });
  }

  try {
    // 1. DB에 있는지 확인
    const result = await pool.query(
      "SELECT * FROM refresh_tokens WHERE refresh_token = $1",
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }

    // 2. 유효한 JWT인지 확인
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "토큰이 만료되었거나 유효하지 않습니다." });

      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken: newAccessToken });
    });

  } catch (err) {
    console.error("토큰 재발급 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
  }

  try {
    // DB에서 해당 토큰 삭제
    await pool.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1 AND refresh_token = $2",
      [userId, refreshToken]
    );

    res.json({ message: "로그아웃 되었습니다." });
  } catch (err) {
    console.error("로그아웃 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


module.exports = router;
