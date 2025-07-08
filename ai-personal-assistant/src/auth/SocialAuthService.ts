import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// 웹에서 인증 세션을 완료하기 위해 등록
WebBrowser.maybeCompleteAuthSession();

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'kakao';
  };
  error?: string;
}

// Google OAuth 설정
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // 실제 Google Cloud Console에서 가져와야 함
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'ai-personal-assistant',
  path: 'auth',
});

// Kakao OAuth 설정
const KAKAO_CLIENT_ID = 'YOUR_KAKAO_CLIENT_ID'; // 실제 Kakao Developers에서 가져와야 함
const KAKAO_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'ai-personal-assistant',
  path: 'auth',
});

export class SocialAuthService {
  // Google OAuth 로그인
  static async signInWithGoogle(): Promise<AuthResult> {
    try {
      // 실제 Client ID가 설정되지 않은 경우 오류 반환
      if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        return {
          success: false,
          error: 'Google OAuth가 설정되지 않았습니다. 개발자에게 문의하세요.',
        };
      }

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params.code) {
        // 실제 구현에서는 서버에서 토큰을 교환하고 사용자 정보를 가져와야 함
        // 여기서는 시뮬레이션된 사용자 데이터를 반환
        return {
          success: true,
          user: {
            id: 'google_' + Date.now(),
            email: 'user@gmail.com',
            name: 'Google User',
            avatar: 'https://via.placeholder.com/150',
            provider: 'google',
          },
        };
      } else {
        return {
          success: false,
          error: 'Google OAuth 로그인이 취소되었습니다.',
        };
      }
    } catch (error) {
      console.error('Google OAuth sign in error:', error);
      return {
        success: false,
        error: 'Google OAuth 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // Kakao OAuth 로그인
  static async signInWithKakao(): Promise<AuthResult> {
    try {
      // 실제 Client ID가 설정되지 않은 경우 오류 반환
      if (KAKAO_CLIENT_ID === 'YOUR_KAKAO_CLIENT_ID') {
        return {
          success: false,
          error: 'Kakao OAuth가 설정되지 않았습니다. 개발자에게 문의하세요.',
        };
      }

      const request = new AuthSession.AuthRequest({
        clientId: KAKAO_CLIENT_ID,
        scopes: ['profile_nickname', 'account_email'],
        redirectUri: KAKAO_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
      });

      if (result.type === 'success' && result.params.code) {
        // 실제 구현에서는 서버에서 토큰을 교환하고 사용자 정보를 가져와야 함
        // 여기서는 시뮬레이션된 사용자 데이터를 반환
        return {
          success: true,
          user: {
            id: 'kakao_' + Date.now(),
            email: 'user@kakao.com',
            name: 'Kakao User',
            avatar: 'https://via.placeholder.com/150',
            provider: 'kakao',
          },
        };
      } else {
        return {
          success: false,
          error: 'Kakao OAuth 로그인이 취소되었습니다.',
        };
      }
    } catch (error) {
      console.error('Kakao OAuth sign in error:', error);
      return {
        success: false,
        error: 'Kakao OAuth 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // 웹 환경에서의 OAuth 시뮬레이션 (개발용)
  static async simulateSocialLogin(provider: 'google' | 'kakao'): Promise<AuthResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: `${provider}_${Date.now()}`,
            email: `user@${provider}.com`,
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth User`,
            avatar: `https://via.placeholder.com/150/4285f4/ffffff?text=${provider.charAt(0).toUpperCase()}`,
            provider,
          },
        });
      }, 1000);
    });
  }

  // OAuth 설정 상태 확인
  static getOAuthStatus() {
    return {
      google: GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID',
      kakao: KAKAO_CLIENT_ID !== 'YOUR_KAKAO_CLIENT_ID',
    };
  }
} 