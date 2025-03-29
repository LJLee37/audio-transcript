const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

// 사용자 데이터를 저장할 파일 경로
const usersFilePath = path.join(__dirname, "../../data/users.json");

// 데이터 디렉토리 확인 및 생성
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 사용자 파일이 없으면 빈 배열로 초기화
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

class User {
  constructor(email, name, nickname, password) {
    this.id = Date.now().toString();
    this.email = email;
    this.name = name;
    this.nickname = nickname;
    this.password = password;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // 모든 사용자 가져오기
  static getAll() {
    try {
      const data = fs.readFileSync(usersFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading users file:", error);
      return [];
    }
  }

  // ID로 사용자 찾기
  static findById(id) {
    const users = this.getAll();
    return users.find((user) => user.id === id);
  }

  // 이메일로 사용자 찾기
  static findByEmail(email) {
    const users = this.getAll();
    return users.find((user) => user.email === email);
  }

  // 사용자 저장
  static saveUsers(users) {
    try {
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error("Error writing users file:", error);
      return false;
    }
  }

  // 새 사용자 생성
  static async create(userData) {
    try {
      const users = this.getAll();

      // 이메일 중복 확인
      if (users.some((user) => user.email === userData.email)) {
        throw new Error("Email already exists");
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = new User(
        userData.email,
        userData.name,
        userData.nickname,
        hashedPassword
      );

      // 민감한 정보 제외
      const userToSave = { ...newUser };

      users.push(userToSave);
      this.saveUsers(users);

      // 비밀번호 제외하고 반환
      const { password, ...userWithoutPassword } = userToSave;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 인증
  static async authenticate(email, password) {
    try {
      const user = this.findByEmail(email);

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  }

  // 사용자 업데이트
  static update(id, updateData) {
    try {
      const users = this.getAll();
      const userIndex = users.findIndex((user) => user.id === id);

      if (userIndex === -1) {
        return null;
      }

      // 업데이트할 수 없는 필드 제외
      const {
        id: _,
        email: __,
        password: ___,
        createdAt: ____,
        ...allowedUpdates
      } = updateData;

      users[userIndex] = {
        ...users[userIndex],
        ...allowedUpdates,
        updatedAt: new Date().toISOString(),
      };

      this.saveUsers(users);

      // 비밀번호 제외하고 반환
      const { password, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
    } catch (error) {
      console.error("Update error:", error);
      return null;
    }
  }

  // 사용자 삭제
  static delete(id) {
    try {
      const users = this.getAll();
      const filteredUsers = users.filter((user) => user.id !== id);

      if (users.length === filteredUsers.length) {
        return false;
      }

      this.saveUsers(filteredUsers);
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  }
}

module.exports = User;
