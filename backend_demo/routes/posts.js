const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const pool = require('../db');

// ✅ 글 등록 (로그인 필요)
// 게시글 등록
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, fileName } = req.body;
    const userId = req.user.id; // 토큰에서 추출된 유저 ID

    if (!title || !content) {
      return res.status(400).json({ message: "제목과 내용을 모두 입력해주세요." });
    }

    const result = await pool.query(
      "INSERT INTO posts (title, content, file_name, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [title, content, fileName || "", userId]
    );

    res.status(201).json({ message: "게시글이 등록되었습니다!", post: result.rows[0] });
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 게시글 수정 API
router.put("/:id", authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const { title, content, fileName } = req.body;
  const userId = req.user.id; // 인증 미들웨어에서 전달된 사용자 ID

  try {
    // 수정할 게시글이 사용자 본인이 작성한 것인지 확인
    const result = await pool.query(
      "SELECT * FROM posts WHERE id = $1",
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    const post = result.rows[0];

    if (post.user_id !== userId) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    // 게시글 수정
    await pool.query(
      `UPDATE posts
       SET title = $1, content = $2, file_name = $3
       WHERE id = $4`,
      [title, content, fileName || "", postId]
    );

    res.json({ message: "게시글이 수정되었습니다." });

  } catch (err) {
    console.error("게시글 수정 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // 게시글 존재 여부 및 작성자 확인
    const result = await pool.query(
      "SELECT * FROM posts WHERE id = $1",
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    const post = result.rows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    // 삭제 쿼리 실행
    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

    res.json({ message: "게시글이 삭제되었습니다." });
  } catch (err) {
    console.error("게시글 삭제 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 게시글 목록 조회
router.get("/", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT posts.id, posts.title, posts.created_at AS created_at, users.username AS author
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
        `SELECT posts.id, posts.title, posts.content, posts.created_at AS created_at,
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