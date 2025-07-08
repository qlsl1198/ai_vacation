# AI 개인 비서 앱 🤖

React Native와 Expo를 사용하여 개발된 AI 개인 비서 모바일 애플리케이션입니다. OpenAI API를 활용하여 채팅, 음성 인식, 이미지 분석 등의 기능을 제공합니다.

## ✨ 주요 기능

### 💬 AI 채팅
- OpenAI GPT API를 활용한 자연스러운 대화
- 실시간 메시지 전송 및 응답
- 대화 기록 저장

### 🎤 음성 인식
- OpenAI Whisper API를 활용한 음성-텍스트 변환
- 음성 메모 녹음 및 저장
- 음성 합성 (TTS) 기능

### 📷 이미지 분석
- OpenAI GPT-4o Vision API를 활용한 이미지 분석
- 카메라 촬영 및 갤러리에서 이미지 선택
- 텍스트 추출 (OCR), 객체 인식, 얼굴 인식

### ⚙️ 설정 관리
- OpenAI API 키 설정 및 관리
- AsyncStorage를 통한 안전한 키 저장
- 사용자 가이드 및 도움말

## 🚀 기술 스택

- **Frontend**: React Native, Expo
- **UI Framework**: React Native Paper
- **State Management**: React Hooks
- **Storage**: AsyncStorage
- **AI Services**: OpenAI API (GPT, Whisper, Vision)
- **Platform**: iOS, Android, Web

## 📱 설치 및 실행

### 필수 요구사항
- Node.js (v16 이상)
- npm 또는 yarn
- Expo CLI
- OpenAI API 키

### 설치 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd ai-personal-assistant
```

2. 의존성 설치
```bash
npm install
```

3. Expo 개발 서버 실행
```bash
npm start
```

4. 플랫폼 선택
- **웹**: `w` 키를 눌러 브라우저에서 실행
- **iOS**: `i` 키를 눌러 iOS 시뮬레이터에서 실행
- **Android**: `a` 키를 눌러 Android 에뮬레이터에서 실행
- **모바일**: QR 코드를 스캔하여 Expo Go 앱에서 실행

## 🔧 설정

### OpenAI API 키 설정

1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 발급
2. 앱의 설정 탭에서 API 키 입력
3. 모든 AI 기능 사용 가능

### 지원하는 OpenAI 모델

- **채팅**: `gpt-3.5-turbo`, `gpt-4o`
- **음성 인식**: `whisper-1`
- **이미지 분석**: `gpt-4o`

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ImageAnalyzer.tsx
│   ├── UserGuide.tsx
│   └── VoiceRecorder.tsx
├── screens/            # 화면 컴포넌트
│   ├── HomeScreen.tsx
│   ├── ChatScreen.tsx
│   ├── VoiceScreen.tsx
│   ├── CameraScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # 비즈니스 로직 및 API
│   ├── api.ts
│   ├── storage.ts
│   ├── VoiceService.ts
│   └── ImageAnalysisService.ts
├── auth/               # 인증 관련
│   └── AuthContext.tsx
└── theme/              # 테마 설정
    └── ThemeProvider.tsx
```

## 🔒 보안

- API 키는 AsyncStorage에 암호화되어 저장됩니다
- 민감한 정보는 .gitignore에 포함되어 있습니다
- 웹 환경에서도 안전한 API 호출이 가능합니다

## 🌐 웹 호환성

- 웹 환경에서도 모든 기능이 정상 작동합니다
- 이미지 처리는 웹 호환 방식으로 구현되었습니다
- 반응형 디자인으로 다양한 화면 크기에 대응합니다

## 📝 사용 예시

### 채팅 기능
```
사용자: "오늘 날씨 어때?"
AI: "죄송하지만 실시간 날씨 정보에 접근할 수 없습니다. 
     현재 위치의 날씨를 확인하려면 날씨 앱을 사용해보세요."
```

### 이미지 분석
```
사용자: [문서 이미지 업로드]
AI: "이 이미지는 회의 일정표로 보입니다. 
     주요 내용: 오후 2시 팀 미팅, 4시 고객 미팅 예정"
```

### 음성 인식
```
사용자: [음성으로 "내일 오후 3시에 약속이 있어"]
AI: "내일 오후 3시에 약속이 있다" (텍스트로 변환)
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 Issues 탭을 이용해 주세요.

---

**개발자**: AI Personal Assistant Team  
**버전**: 1.0.0  
**최종 업데이트**: 2024년 12월 