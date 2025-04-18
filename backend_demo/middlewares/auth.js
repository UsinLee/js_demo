// middlewares/auth.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
    }

    req.user = user; // 다음 미들웨어 또는 라우터에서 사용 가능
    next();
  });
}

module.exports = authenticateToken;
