const express = require("express");
const router = express.Router();
const transcriptController = require("../controllers/transcriptController");
const { authenticateToken } = require("../middlewares/auth");

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사용자의 모든 트랜스크립트 조회
router.get("/", transcriptController.getUserTranscripts);

// 새 트랜스크립트 생성 (파일 업로드)
router.post("/upload", transcriptController.uploadAudio);

// 특정 트랜스크립트 조회
router.get("/:id", transcriptController.getTranscript);

// 트랜스크립트 텍스트 업데이트 (편집)
router.put("/:id/text", transcriptController.updateTranscriptText);

// 트랜스크립트 삭제
router.delete("/:id", transcriptController.deleteTranscript);

// 트랜스크립트 텍스트 다운로드
router.get("/:id/download", transcriptController.downloadTranscriptText);

module.exports = router;
