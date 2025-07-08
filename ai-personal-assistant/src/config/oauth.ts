// OAuth 설정
export const OAUTH_CONFIG = {
  // Google OAuth 설정
  GOOGLE: {
    CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
    CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    REDIRECT_URI: 'ai-personal-assistant://oauth/google',
  },
  
  // Kakao OAuth 설정
  KAKAO: {
    CLIENT_ID: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID || 'your-kakao-client-id',
    REDIRECT_URI: 'ai-personal-assistant://oauth/kakao',
  },
};

// OAuth Discovery 설정
export const OAUTH_DISCOVERY = {
  GOOGLE: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  },
  
  KAKAO: {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
    revocationEndpoint: 'https://kapi.kakao.com/v1/user/logout',
  },
};

// 개발 모드 확인
export const IS_DEVELOPMENT = __DEV__;

// OAuth 설정 상태 확인
export const getOAuthStatus = () => {
  const googleConfigured = OAUTH_CONFIG.GOOGLE.CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com';
  const kakaoConfigured = OAUTH_CONFIG.KAKAO.CLIENT_ID !== 'your-kakao-client-id';
  
  return {
    google: googleConfigured,
    kakao: kakaoConfigured,
  };
}; 