const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  // 헤더에서 토큰 가져오기
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN 형식에서 TOKEN 부분만 추출

  if (!token) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 가져오기
    const user = User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};

module.exports = { authenticateToken };
