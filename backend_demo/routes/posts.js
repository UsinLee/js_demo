const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const pool = require('../db');

// ✅ 글 등록 (로그인 필요)
router.post('/create', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id; // JWT에서 추출한 사용자 ID

  if (!title || !content) {
    return res.status(400).json({ message: "제목과 내용을 모두 입력하세요." });
  }

  try {
    await pool.query(
      "INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)",
      [title, content, userId]
    );
    res.status(201).json({ message: "게시글이 등록되었습니다." });
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    console.error("게시글 등록 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 게시글 목록 조회
router.get("/", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT posts.id, posts.title, posts.created_at AS date, users.username AS author
         FROM posts
         JOIN users ON posts.user_id = users.id
         ORDER BY posts.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("게시글 목록 조회 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
});
  
// 게시글 상세 조회
router.get("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT posts.id, posts.title, posts.content, posts.created_at AS date,
                posts.file_name, users.username AS author
         FROM posts
         JOIN users ON posts.user_id = users.id
         WHERE posts.id = $1`,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error("게시글 조회 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
});
  

module.exports = router;