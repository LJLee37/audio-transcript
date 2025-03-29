const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const Transcript = require("../models/Transcript");

// Whisper 모델 경로
const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || "./models/whisper";

// 음성 파일을 텍스트로 변환하는 함수
const transcribeAudio = async (audioPath, transcriptId) => {
  try {
    // 트랜스크립트 상태 업데이트
    Transcript.update(transcriptId, { status: "processing" });

    // Whisper 명령어 실행
    // 참고: 실제 구현 시에는 서버에 설치된 Whisper 경로와 옵션을 적절히 설정해야 함
    return new Promise((resolve, reject) => {
      // 예시: whisper 명령어 실행 (실제 환경에 맞게 수정 필요)
      const whisperProcess = spawn("whisper", [
        audioPath,
        "--model",
        "medium",
        "--language",
        "ko",
        "--output_dir",
        path.dirname(audioPath),
        "--output_format",
        "txt",
      ]);

      let output = "";
      let errorOutput = "";

      whisperProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      whisperProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      whisperProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`Whisper process exited with code ${code}`);
          console.error(`Error output: ${errorOutput}`);

          // 트랜스크립트 상태 업데이트
          Transcript.update(transcriptId, {
            status: "failed",
            error: errorOutput,
          });

          reject(new Error(`Transcription failed with code ${code}`));
          return;
        }

        // 생성된 텍스트 파일 경로
        const textFilePath = `${path.dirname(audioPath)}/${path.basename(
          audioPath,
          path.extname(audioPath)
        )}.txt`;

        // 텍스트 파일이 존재하는지 확인
        if (!fs.existsSync(textFilePath)) {
          const error = new Error("Transcription output file not found");

          // 트랜스크립트 상태 업데이트
          Transcript.update(transcriptId, {
            status: "failed",
            error: error.message,
          });

          reject(error);
          return;
        }

        // 텍스트 파일 읽기
        const text = fs.readFileSync(textFilePath, "utf8");

        // 텍스트 크기 확인
        if (!Transcript.checkTextSize(text)) {
          const error = new Error(
            "Transcription text exceeds maximum size (1MB)"
          );

          // 트랜스크립트 상태 업데이트
          Transcript.update(transcriptId, {
            status: "failed",
            error: error.message,
          });

          reject(error);
          return;
        }

        // 트랜스크립트 텍스트 저장
        Transcript.saveText(transcriptId, text);

        // 임시 텍스트 파일 삭제
        fs.unlinkSync(textFilePath);

        resolve(text);
      });
    });
  } catch (error) {
    console.error("Transcribe error:", error);

    // 트랜스크립트 상태 업데이트
    Transcript.update(transcriptId, {
      status: "failed",
      error: error.message,
    });

    throw error;
  }
};

// 음성 파일 형식 검증
const validateAudioFile = (file) => {
  // 지원하는 파일 형식
  const supportedFormats = [".m4a", ".mp3", ".wav", ".ogg", ".flac"];

  // 파일 확장자 확인
  const ext = path.extname(file.originalname).toLowerCase();
  if (!supportedFormats.includes(ext)) {
    return {
      valid: false,
      message:
        "지원하지 않는 파일 형식입니다. 지원 형식: m4a, mp3, wav, ogg, flac",
    };
  }

  // 파일 크기 제한 (50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      message: "파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.",
    };
  }

  return { valid: true };
};

module.exports = {
  transcribeAudio,
  validateAudioFile,
};
