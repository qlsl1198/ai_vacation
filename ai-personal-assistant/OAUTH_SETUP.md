# OAuth 설정 가이드

이 문서는 AI 개인 비서 앱에서 Google과 Kakao OAuth를 설정하는 방법을 설명합니다.

## 1. Google OAuth 설정

### 1.1 Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"로 이동

### 1.2 OAuth 2.0 클라이언트 ID 생성

1. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
2. 애플리케이션 유형 선택:
   - **웹 애플리케이션**: 웹 버전용
   - **Android**: Android 앱용
   - **iOS**: iOS 앱용

3. 승인된 리디렉션 URI 추가:
   ```
   ai-personal-assistant://oauth/google
   ```

4. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

### 1.3 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 2. Kakao OAuth 설정

### 2.1 Kakao Developers에서 앱 생성

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 새 애플리케이션 생성
3. "플랫폼" 설정에서 플랫폼 추가

### 2.2 플랫폼별 설정

#### 웹 플랫폼
- 사이트 도메인: `localhost:19006`
- JavaScript 키 복사

#### Android 플랫폼
- 패키지명: `com.anonymous.aipersonalassistant`
- 키 해시 등록

#### iOS 플랫폼
- 번들 ID: `com.anonymous.aipersonalassistant`

### 2.3 동의항목 설정

1. "동의항목" 메뉴로 이동
2. 다음 항목들을 "필수"로 설정:
   - 닉네임 (profile_nickname)
   - 이메일 (account_email)

### 2.4 환경 변수 설정

`.env` 파일에 추가:

```env
EXPO_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
```

## 3. 앱 설정

### 3.1 app.config.js 확인

앱 스킴이 올바르게 설정되어 있는지 확인:

```javascript
export default {
  expo: {
    // ... 기타 설정
    scheme: "ai-personal-assistant",
    // ... 기타 설정
  }
};
```

### 3.2 환경 변수 로드

앱에서 환경 변수를 사용할 수 있도록 설정:

```javascript
// src/config/oauth.ts
export const OAUTH_CONFIG = {
  GOOGLE: {
    CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
    CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    REDIRECT_URI: 'ai-personal-assistant://oauth/google',
  },
  KAKAO: {
    CLIENT_ID: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID || 'your-kakao-client-id',
    REDIRECT_URI: 'ai-personal-assistant://oauth/kakao',
  },
};
```

## 4. 테스트

### 4.1 개발자 테스트 로그인

OAuth 설정이 완료되기 전까지는 개발자 테스트 로그인을 사용할 수 있습니다:

1. 앱 실행
2. 로그인 화면에서 "Google 테스트 로그인" 또는 "Kakao 테스트 로그인" 버튼 클릭
3. 테스트 사용자로 로그인 확인

### 4.2 실제 OAuth 테스트

1. 환경 변수 설정 완료
2. 앱 재시작
3. "Google OAuth로 계속하기" 또는 "Kakao OAuth로 계속하기" 버튼 클릭
4. 실제 OAuth 플로우 테스트

## 5. 문제 해결

### 5.1 일반적인 오류

- **"OAuth 미설정"**: 환경 변수가 올바르게 설정되지 않음
- **"리디렉션 URI 불일치"**: Google/Kakao 콘솔의 리디렉션 URI 설정 확인
- **"권한 없음"**: 동의항목 설정 확인

### 5.2 디버깅

1. 콘솔 로그 확인
2. 네트워크 요청 모니터링
3. OAuth 설정 상태 확인:

```javascript
import { getOAuthStatus } from './src/config/oauth';

console.log('OAuth 상태:', getOAuthStatus());
```

## 6. 보안 고려사항

1. **클라이언트 보안 비밀번호**: 웹에서만 사용하고, 모바일 앱에서는 제거
2. **환경 변수**: `.env` 파일을 `.gitignore`에 추가
3. **토큰 관리**: 액세스 토큰을 안전하게 저장하고 관리
4. **로그아웃**: 사용자 로그아웃 시 토큰 무효화

## 7. 배포 시 고려사항

1. **프로덕션 환경 변수**: 배포 환경에서 올바른 OAuth 설정 사용
2. **도메인 설정**: 프로덕션 도메인을 OAuth 콘솔에 등록
3. **앱 스토어**: 앱 스토어 배포 시 OAuth 설정 업데이트

---

이 가이드를 따라 OAuth 설정을 완료하면 안전하고 편리한 소셜 로그인을 사용할 수 있습니다. 