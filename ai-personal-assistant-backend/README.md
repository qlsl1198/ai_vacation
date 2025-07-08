# AI Personal Assistant Backend

AI Personal Assistant 앱의 백엔드 API 서버입니다.

## 🚀 주요 기능

### 🔐 인증 시스템
- JWT 기반 사용자 인증
- 회원가입/로그인
- 비밀번호 암호화 (bcrypt)

### 💬 AI 채팅
- OpenAI API 연동 (예정)
- 대화형 AI 응답
- 채팅 히스토리 관리

### 🎤 음성 처리
- Google Speech-to-Text API 연동 (예정)
- Google Text-to-Speech API 연동 (예정)
- 음성 파일 업로드/처리

### 📷 이미지 분석
- Google Vision API 연동 (예정)
- 텍스트 추출 (OCR)
- 객체 인식
- 얼굴 감지

### 👤 사용자 관리
- 프로필 관리
- 설정 저장
- 데이터 백업/복원

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **File Upload**: Multer
- **AI Services**: OpenAI, Google Cloud APIs

## 📦 설치 및 실행

### 필수 요구사항
- Node.js (v16 이상)
- MongoDB
- API 키들 (OpenAI, Google Cloud)

### 설치 방법

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
```bash
cp env.example .env
# .env 파일을 편집하여 API 키들을 설정
```

3. **개발 모드 실행**
```bash
npm run dev
```

4. **프로덕션 빌드**
```bash
npm run build
npm start
```

## 🔧 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 채팅
- `POST /api/chat/message` - AI에게 메시지 전송

### 음성
- `POST /api/voice/speech-to-text` - 음성을 텍스트로 변환
- `POST /api/voice/text-to-speech` - 텍스트를 음성으로 변환

### 이미지
- `POST /api/image/analyze` - 이미지 분석

### 사용자
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/profile` - 프로필 수정

## 🔐 환경 변수

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-assistant

# JWT
JWT_SECRET=your-super-secret-jwt-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## 📁 프로젝트 구조

```
src/
├── controllers/     # 컨트롤러
├── models/         # 데이터베이스 모델
├── routes/         # API 라우트
├── middleware/     # 미들웨어
├── services/       # 비즈니스 로직
├── utils/          # 유틸리티 함수
└── index.ts        # 서버 진입점
```

## 🚀 향후 계획

- [ ] OpenAI API 연동
- [ ] Google Speech-to-Text API 연동
- [ ] Google Vision API 연동
- [ ] 파일 업로드 기능
- [ ] 실시간 채팅 (WebSocket)
- [ ] 푸시 알림
- [ ] 데이터 백업/복원
- [ ] API 문서화 (Swagger)

## 📄 라이선스

MIT License 