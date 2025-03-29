# 음성 파일 텍스트 변환 웹사이트 개발 요약

## 요구사항
- 아치리눅스 서버에서 돌아가는 자체 transcript 엔진 필요
- 프론트엔드 프레임워크: 최신 Quasar
- 백엔드: Express.js
- 서버 주소: server.ljlee37.com
- certbot으로 생성한 인증서 사용
- HTTPS 지원
- 외부 노출 포트 번호: 5759
- 음성 인식 엔진: OpenAI Whisper (한국어 특화)
- 비동기 처리 방식으로 음성 변환 처리
- 사용자 인증 기능 필요 (회원가입/로그인)
- 사용자 등록 시 이메일, 이름, 닉네임 저장
- 변환된 텍스트는 파일 시스템에 저장
- 파일 저장 기간에 제한 없음
- 변환된 텍스트의 최대 용량은 개당 1메가바이트
- 텍스트 편집, 공유, 다운로드 등의 추가 기능 필요
- 패키지 매니저: yarn

## 개발 과정
1. 프로젝트 구조 설정
   - 백엔드와 프론트엔드 디렉토리 생성
   - 필요한 패키지 설치

2. 백엔드 개발
   - Express.js 서버 설정
   - 사용자 인증 시스템 구현 (JWT)
   - 파일 업로드 및 처리 기능 구현
   - 트랜스크립트 관리 API 구현

3. 프론트엔드 개발
   - Quasar 프로젝트 설정
   - 다국어 지원 (한국어, 영어)
   - 로그인/회원가입 페이지 구현
   - 트랜스크립트 목록 및 상세 페이지 구현
   - 파일 업로드 컴포넌트 구현

## 구현된 기능

1. **사용자 인증 시스템**
   - 회원가입 및 로그인 기능
   - JWT 기반 인증
   - 사용자 정보 관리 (이메일, 이름, 닉네임)

2. **음성 파일 처리**
   - m4a, mp3, wav, ogg, flac 형식 지원
   - 파일 업로드 및 관리
   - OpenAI Whisper 기반 음성 인식 (한국어 특화)
   - 비동기 처리 방식

3. **트랜스크립트 관리**
   - 변환된 텍스트 저장 및 조회
   - 텍스트 편집 기능
   - 다운로드 기능
   - 삭제 기능

4. **다국어 지원**
   - 한국어 기본 지원
   - 영어 지원

## 프로젝트 구조

### 백엔드
```
audio-transcript-app/backend/
├── .env                      # 환경 변수 설정
├── package.json              # 패키지 정보 및 스크립트
├── src/
│   ├── index.js              # 서버 진입점
│   ├── controllers/          # 컨트롤러
│   │   ├── authController.js # 인증 관련 컨트롤러
│   │   └── transcriptController.js # 트랜스크립트 관련 컨트롤러
│   ├── middlewares/          # 미들웨어
│   │   └── auth.js           # 인증 미들웨어
│   ├── models/               # 모델
│   │   ├── User.js           # 사용자 모델
│   │   └── Transcript.js     # 트랜스크립트 모델
│   ├── routes/               # 라우트
│   │   ├── auth.js           # 인증 관련 라우트
│   │   └── transcripts.js    # 트랜스크립트 관련 라우트
│   └── utils/                # 유틸리티
│       └── transcriptUtil.js # 트랜스크립트 관련 유틸리티
```

### 프론트엔드
```
audio-transcript-app/frontend/audio-transcript-front/
├── public/                   # 정적 파일
├── src/
│   ├── assets/               # 에셋 파일
│   ├── boot/                 # 부트 파일
│   │   ├── axios.js          # API 설정
│   │   └── i18n.js           # 다국어 설정
│   ├── components/           # 컴포넌트
│   ├── css/                  # CSS 파일
│   ├── i18n/                 # 다국어 파일
│   │   ├── en-US/            # 영어
│   │   └── ko-KR/            # 한국어
│   ├── layouts/              # 레이아웃
│   │   └── MainLayout.vue    # 메인 레이아웃
│   ├── pages/                # 페이지
│   │   ├── IndexPage.vue     # 메인 페이지
│   │   ├── LoginPage.vue     # 로그인 페이지
│   │   └── RegisterPage.vue  # 회원가입 페이지
│   └── router/               # 라우터
│       ├── index.js          # 라우터 설정
│       └── routes.js         # 라우트 정의
```

## 실행 방법

1. **백엔드 서버 실행**
   ```bash
   cd audio-transcript-app/backend
   yarn install
   yarn dev
   ```

2. **프론트엔드 개발 서버 실행**
   ```bash
   cd audio-transcript-app/frontend/audio-transcript-front
   yarn install
   yarn dev
   ```

3. **프로덕션 배포**
   - 백엔드: `yarn start`
   - 프론트엔드: `yarn build` 후 생성된 파일을 웹 서버에 배포

## 참고 사항

- 실제 프로덕션 환경에서는 OpenAI Whisper 엔진을 서버에 설치하고 설정해야 합니다.
- 서버 주소(server.ljlee37.com)와 포트(5759)는 요구사항에 맞게 설정되어 있습니다.
- HTTPS 설정은 certbot으로 생성한 인증서를 사용합니다.
