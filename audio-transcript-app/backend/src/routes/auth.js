const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");

// 회원가입
router.post("/register", authController.register);

// 로그인
router.post("/login", authController.login);

// 현재 사용자 정보 조회 (인증 필요)
router.get("/me", authenticateToken, authController.getCurrentUser);

// 사용자 정보 업데이트 (인증 필요)
router.put("/me", authenticateToken, authController.updateUser);

module.exports = router;
