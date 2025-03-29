const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 사용자 등록
const register = async (req, res) => {
  try {
    const { email, name, nickname, password } = req.body;

    // 필수 필드 검증
    if (!email || !name || !nickname || !password) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요." });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "유효한 이메일 주소를 입력해주세요." });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "비밀번호는 최소 6자 이상이어야 합니다." });
    }

    // 사용자 생성
    const user = await User.create({ email, name, nickname, password });

    // JWT 토큰 생성
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "회원가입이 완료되었습니다.",
      user,
      token,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(400).json({ message: "이미 등록된 이메일입니다." });
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "이메일과 비밀번호를 입력해주세요." });
    }

    // 사용자 인증
    const user = await User.authenticate(email, password);

    if (!user) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "로그인이 완료되었습니다.",
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 현재 사용자 정보 조회
const getCurrentUser = (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 사용자 정보 업데이트
const updateUser = (req, res) => {
  try {
    const { name, nickname } = req.body;
    const updatedUser = User.update(req.user.id, { name, nickname });

    if (!updatedUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "사용자 정보가 업데이트되었습니다.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUser,
};
