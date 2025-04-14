// routes/test.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`현재 시간: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB 오류");
  }
});

module.exports = router;
