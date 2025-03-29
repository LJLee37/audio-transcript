const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");

// 환경 변수 로드
dotenv.config();

// 필요한 디렉토리 생성
const uploadDir = path.join(
  __dirname,
  "..",
  process.env.UPLOAD_DIR || "uploads"
);
const transcriptDir = path.join(
  __dirname,
  "..",
  process.env.TRANSCRIPT_DIR || "transcripts"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(transcriptDir)) {
  fs.mkdirSync(transcriptDir, { recursive: true });
}

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "..", "public")));

// 라우트 설정
app.use("/api/auth", require("./routes/auth"));
app.use("/api/transcripts", require("./routes/transcripts"));

// 기본 라우트
app.get("/", (req, res) => {
  res.send("Audio Transcript API Server");
});

// 서버 시작
const PORT = process.env.PORT || 5759;

// HTTPS 설정
if (process.env.NODE_ENV === "production") {
  try {
    const privateKey = fs.readFileSync(
      "/etc/letsencrypt/live/server.ljlee37.com/privkey.pem",
      "utf8"
    );
    const certificate = fs.readFileSync(
      "/etc/letsencrypt/live/server.ljlee37.com/cert.pem",
      "utf8"
    );
    const ca = fs.readFileSync(
      "/etc/letsencrypt/live/server.ljlee37.com/chain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };

    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error loading SSL certificates:", error);
    console.log("Starting server without HTTPS...");
    app.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}

module.exports = app;
