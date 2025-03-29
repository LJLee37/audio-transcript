const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Transcript = require("../models/Transcript");
const {
  transcribeAudio,
  validateAudioFile,
} = require("../utils/transcriptUtil");

// 파일 업로드 설정
const uploadDir = path.join(
  __dirname,
  "../../",
  process.env.UPLOAD_DIR || "uploads"
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 사용자별 디렉토리 생성
    const userDir = path.join(uploadDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // 파일명 설정: timestamp-원본파일명
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${path.basename(
      file.originalname,
      ext
    )}${ext}`;
    cb(null, filename);
  },
});

// 파일 필터
const fileFilter = (req, file, cb) => {
  const validation = validateAudioFile(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.message), false);
  }
};

// Multer 업로드 미들웨어
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("audio");

// 파일 업로드 및 트랜스크립트 생성
const uploadAudio = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer 에러 처리
        return res.status(400).json({ message: `업로드 에러: ${err.message}` });
      }
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
    }

    try {
      // 트랜스크립트 생성
      const transcript = Transcript.create({
        userId: req.user.id,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        status: "pending",
      });

      // 오디오 파일 경로 업데이트
      Transcript.update(transcript.id, {
        audioPath: req.file.path,
      });

      // 비동기로 트랜스크립션 시작
      transcribeAudio(req.file.path, transcript.id)
        .then(() => {
          console.log(`Transcription completed for ${transcript.id}`);
        })
        .catch((error) => {
          console.error(`Transcription error for ${transcript.id}:`, error);
        });

      res.status(201).json({
        message: "파일이 업로드되었습니다. 트랜스크립션이 진행 중입니다.",
        transcript,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });
};

// 사용자의 모든 트랜스크립트 조회
const getUserTranscripts = (req, res) => {
  try {
    const transcripts = Transcript.findByUserId(req.user.id);
    res.status(200).json({ transcripts });
  } catch (error) {
    console.error("Get transcripts error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 특정 트랜스크립트 조회
const getTranscript = (req, res) => {
  try {
    const transcript = Transcript.findById(req.params.id);

    if (!transcript) {
      return res
        .status(404)
        .json({ message: "트랜스크립트를 찾을 수 없습니다." });
    }

    // 권한 확인
    if (transcript.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "이 트랜스크립트에 접근할 권한이 없습니다." });
    }

    res.status(200).json({ transcript });
  } catch (error) {
    console.error("Get transcript error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 트랜스크립트 텍스트 업데이트 (편집)
const updateTranscriptText = (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "텍스트가 제공되지 않았습니다." });
    }

    const transcript = Transcript.findById(req.params.id);

    if (!transcript) {
      return res
        .status(404)
        .json({ message: "트랜스크립트를 찾을 수 없습니다." });
    }

    // 권한 확인
    if (transcript.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "이 트랜스크립트를 수정할 권한이 없습니다." });
    }

    // 텍스트 크기 확인
    if (!Transcript.checkTextSize(text)) {
      return res
        .status(400)
        .json({ message: "텍스트 크기가 최대 허용 크기(1MB)를 초과합니다." });
    }

    // 텍스트 업데이트
    const updated = Transcript.saveText(req.params.id, text);

    if (!updated) {
      return res
        .status(500)
        .json({ message: "텍스트 업데이트에 실패했습니다." });
    }

    const updatedTranscript = Transcript.findById(req.params.id);
    res.status(200).json({
      message: "트랜스크립트가 업데이트되었습니다.",
      transcript: updatedTranscript,
    });
  } catch (error) {
    console.error("Update transcript text error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 트랜스크립트 삭제
const deleteTranscript = (req, res) => {
  try {
    const transcript = Transcript.findById(req.params.id);

    if (!transcript) {
      return res
        .status(404)
        .json({ message: "트랜스크립트를 찾을 수 없습니다." });
    }

    // 권한 확인
    if (transcript.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "이 트랜스크립트를 삭제할 권한이 없습니다." });
    }

    // 트랜스크립트 삭제
    const deleted = Transcript.delete(req.params.id);

    if (!deleted) {
      return res
        .status(500)
        .json({ message: "트랜스크립트 삭제에 실패했습니다." });
    }

    res.status(200).json({ message: "트랜스크립트가 삭제되었습니다." });
  } catch (error) {
    console.error("Delete transcript error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 트랜스크립트 텍스트 다운로드
const downloadTranscriptText = (req, res) => {
  try {
    const transcript = Transcript.findById(req.params.id);

    if (!transcript) {
      return res
        .status(404)
        .json({ message: "트랜스크립트를 찾을 수 없습니다." });
    }

    // 권한 확인
    if (transcript.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "이 트랜스크립트에 접근할 권한이 없습니다." });
    }

    // 텍스트 파일이 없는 경우
    if (!transcript.textPath || !fs.existsSync(transcript.textPath)) {
      return res
        .status(404)
        .json({ message: "트랜스크립트 텍스트 파일을 찾을 수 없습니다." });
    }

    // 파일명 설정
    const filename = `${path.basename(
      transcript.originalFilename,
      path.extname(transcript.originalFilename)
    )}-transcript.txt`;

    // 파일 다운로드
    res.download(transcript.textPath, filename);
  } catch (error) {
    console.error("Download transcript error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

module.exports = {
  uploadAudio,
  getUserTranscripts,
  getTranscript,
  updateTranscriptText,
  deleteTranscript,
  downloadTranscriptText,
};
