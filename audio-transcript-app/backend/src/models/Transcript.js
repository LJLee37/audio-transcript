const fs = require("fs");
const path = require("path");

// 트랜스크립트 데이터를 저장할 파일 경로
const transcriptsFilePath = path.join(__dirname, "../../data/transcripts.json");

// 데이터 디렉토리 확인 및 생성
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 트랜스크립트 파일이 없으면 빈 배열로 초기화
if (!fs.existsSync(transcriptsFilePath)) {
  fs.writeFileSync(transcriptsFilePath, JSON.stringify([], null, 2));
}

class Transcript {
  constructor(userId, originalFilename, fileSize, status = "pending") {
    this.id = Date.now().toString();
    this.userId = userId;
    this.originalFilename = originalFilename;
    this.fileSize = fileSize;
    this.status = status; // pending, processing, completed, failed
    this.text = "";
    this.audioPath = "";
    this.textPath = "";
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.completedAt = null;
  }

  // 모든 트랜스크립트 가져오기
  static getAll() {
    try {
      const data = fs.readFileSync(transcriptsFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading transcripts file:", error);
      return [];
    }
  }

  // ID로 트랜스크립트 찾기
  static findById(id) {
    const transcripts = this.getAll();
    return transcripts.find((transcript) => transcript.id === id);
  }

  // 사용자 ID로 트랜스크립트 찾기
  static findByUserId(userId) {
    const transcripts = this.getAll();
    return transcripts.filter((transcript) => transcript.userId === userId);
  }

  // 트랜스크립트 저장
  static saveTranscripts(transcripts) {
    try {
      fs.writeFileSync(
        transcriptsFilePath,
        JSON.stringify(transcripts, null, 2)
      );
      return true;
    } catch (error) {
      console.error("Error writing transcripts file:", error);
      return false;
    }
  }

  // 새 트랜스크립트 생성
  static create(transcriptData) {
    try {
      const transcripts = this.getAll();

      const newTranscript = new Transcript(
        transcriptData.userId,
        transcriptData.originalFilename,
        transcriptData.fileSize,
        transcriptData.status || "pending"
      );

      transcripts.push(newTranscript);
      this.saveTranscripts(transcripts);

      return newTranscript;
    } catch (error) {
      console.error("Create transcript error:", error);
      throw error;
    }
  }

  // 트랜스크립트 업데이트
  static update(id, updateData) {
    try {
      const transcripts = this.getAll();
      const transcriptIndex = transcripts.findIndex(
        (transcript) => transcript.id === id
      );

      if (transcriptIndex === -1) {
        return null;
      }

      // 상태가 completed로 변경되면 completedAt 설정
      if (
        updateData.status === "completed" &&
        transcripts[transcriptIndex].status !== "completed"
      ) {
        updateData.completedAt = new Date().toISOString();
      }

      transcripts[transcriptIndex] = {
        ...transcripts[transcriptIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      this.saveTranscripts(transcripts);

      return transcripts[transcriptIndex];
    } catch (error) {
      console.error("Update transcript error:", error);
      return null;
    }
  }

  // 트랜스크립트 삭제
  static delete(id) {
    try {
      const transcripts = this.getAll();
      const transcript = this.findById(id);

      if (!transcript) {
        return false;
      }

      // 관련 파일 삭제
      if (transcript.audioPath && fs.existsSync(transcript.audioPath)) {
        fs.unlinkSync(transcript.audioPath);
      }

      if (transcript.textPath && fs.existsSync(transcript.textPath)) {
        fs.unlinkSync(transcript.textPath);
      }

      const filteredTranscripts = transcripts.filter((t) => t.id !== id);

      this.saveTranscripts(filteredTranscripts);
      return true;
    } catch (error) {
      console.error("Delete transcript error:", error);
      return false;
    }
  }

  // 트랜스크립트 텍스트 저장
  static saveText(id, text) {
    try {
      const transcript = this.findById(id);

      if (!transcript) {
        return false;
      }

      // 텍스트 파일 경로 설정
      const textDir = path.join(
        __dirname,
        "../../",
        process.env.TRANSCRIPT_DIR || "transcripts"
      );
      if (!fs.existsSync(textDir)) {
        fs.mkdirSync(textDir, { recursive: true });
      }

      const textPath = path.join(textDir, `${id}.txt`);

      // 텍스트 파일 저장
      fs.writeFileSync(textPath, text, "utf8");

      // 트랜스크립트 업데이트
      this.update(id, {
        text,
        textPath,
        status: "completed",
      });

      return true;
    } catch (error) {
      console.error("Save text error:", error);
      return false;
    }
  }

  // 텍스트 크기 확인 (1MB 제한)
  static checkTextSize(text) {
    // 한글은 UTF-8에서 문자당 최대 3바이트
    const textSize = Buffer.byteLength(text, "utf8");
    const maxSize = 1024 * 1024; // 1MB

    return textSize <= maxSize;
  }
}

module.exports = Transcript;
