// routes/comments.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

// 댓글 생성 API (댓글/대댓글 모두 포함)
router.post("/", authMiddleware, async (req, res) => {
  const { postId, content, parentId } = req.body;
  const authorId = req.user.id;

  try {
    await pool.query(
      `INSERT INTO comments (post_id, author_id, content, parent_id)
       VALUES ($1, $2, $3, $4)`,
      [postId, authorId, content, parentId || null]
    );

    res.json({ message: "댓글이 등록되었습니다." });
  } catch (err) {
    console.error("댓글 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 특정 게시글의 댓글 조회 API
router.get("/:postId", async (req, res) => {
    const postId = req.params.postId;
  
    try {
      const result = await pool.query(
        `SELECT comments.id, comments.post_id, comments.author_id, comments.content, 
                comments.parent_id, comments.is_deleted, comments.created_at,
                users.username AS author
         FROM comments
         JOIN users ON comments.author_id = users.id
         WHERE post_id = $1
         ORDER BY comments.created_at ASC`,
        [postId]
      );
  
      res.json(result.rows);
    } catch (err) {
      console.error("댓글 불러오기 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
});

// 댓글 삭제 API (논리 삭제)
router.delete("/:id", authMiddleware, async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM comments WHERE id = $1`,
      [commentId]
    );

    const comment = result.rows[0];
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comment.author_id !== userId) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await pool.query(
      `UPDATE comments SET is_deleted = true, content = '삭제된 댓글입니다.' WHERE id = $1`,
      [commentId]
    );

    res.json({ message: "댓글이 삭제되었습니다." });
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
