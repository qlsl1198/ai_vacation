import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { OAUTH_CONFIG, OAUTH_DISCOVERY, IS_DEVELOPMENT } from '../config/oauth';

// OAuth 결과를 처리하기 위해 WebBrowser 완료
WebBrowser.maybeCompleteAuthSession();

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'kakao';
}

class OAuthService {
  // Google 로그인
  async signInWithGoogle(): Promise<OAuthUser | null> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'ai-personal-assistant',
        path: 'oauth/google',
      });

      const request = new AuthSession.AuthRequest({
        clientId: OAUTH_CONFIG.GOOGLE.CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync(OAUTH_DISCOVERY.GOOGLE);

      if (result.type === 'success') {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: OAUTH_CONFIG.GOOGLE.CLIENT_ID,
            clientSecret: OAUTH_CONFIG.GOOGLE.CLIENT_SECRET,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          OAUTH_DISCOVERY.GOOGLE
        );

        // 사용자 정보 가져오기
        const userInfo = await this.getGoogleUserInfo(tokenResult.accessToken);
        
        return {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          provider: 'google',
        };
      }

      return null;
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      throw error;
    }
  }

  // Google 사용자 정보 가져오기
  private async getGoogleUserInfo(accessToken: string) {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    return await response.json();
  }

  // Kakao 로그인
  async signInWithKakao(): Promise<OAuthUser | null> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'ai-personal-assistant',
        path: 'oauth/kakao',
      });

      const request = new AuthSession.AuthRequest({
        clientId: OAUTH_CONFIG.KAKAO.CLIENT_ID,
        scopes: ['profile_nickname', 'account_email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync(OAUTH_DISCOVERY.KAKAO);

      if (result.type === 'success') {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: OAUTH_CONFIG.KAKAO.CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          OAUTH_DISCOVERY.KAKAO
        );

        // 사용자 정보 가져오기
        const userInfo = await this.getKakaoUserInfo(tokenResult.accessToken);
        
        return {
          id: userInfo.id.toString(),
          email: userInfo.kakao_account?.email || '',
          name: userInfo.properties?.nickname || 'Kakao 사용자',
          avatar: userInfo.properties?.profile_image,
          provider: 'kakao',
        };
      }

      return null;
    } catch (error) {
      console.error('Kakao 로그인 실패:', error);
      throw error;
    }
  }

  // Kakao 사용자 정보 가져오기
  private async getKakaoUserInfo(accessToken: string) {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return await response.json();
  }

  // 로그아웃
  async signOut(provider: 'google' | 'kakao'): Promise<void> {
    try {
      if (provider === 'google') {
        // Google 로그아웃은 클라이언트에서 처리
        console.log('Google 로그아웃 완료');
      } else if (provider === 'kakao') {
        // Kakao 로그아웃
        const response = await fetch('https://kapi.kakao.com/v1/user/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.getStoredToken('kakao')}`,
          },
        });
        
        if (response.ok) {
          console.log('Kakao 로그아웃 완료');
        }
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  }

  // 토큰 저장 (AsyncStorage 사용)
  private async getStoredToken(provider: string): Promise<string | null> {
    // 실제 구현에서는 AsyncStorage에서 토큰을 가져옴
    return null;
  }

  // 개발용 테스트 로그인
  async signInWithTest(provider: 'google' | 'kakao'): Promise<OAuthUser> {
    const testUsers = {
      google: {
        id: 'google-test-123',
        email: 'test@gmail.com',
        name: 'Google 테스트 사용자',
        avatar: 'https://via.placeholder.com/150',
        provider: 'google' as const,
      },
      kakao: {
        id: 'kakao-test-456',
        email: 'test@kakao.com',
        name: 'Kakao 테스트 사용자',
        avatar: 'https://via.placeholder.com/150',
        provider: 'kakao' as const,
      },
    };

    // 실제 OAuth 대신 테스트 데이터 반환
    return testUsers[provider];
  }

  // OAuth 설정 상태 확인
  isConfigured(provider: 'google' | 'kakao'): boolean {
    if (provider === 'google') {
      return OAUTH_CONFIG.GOOGLE.CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com';
    } else {
      return OAUTH_CONFIG.KAKAO.CLIENT_ID !== 'your-kakao-client-id';
    }
  }
}

export const oauthService = new OAuthService(); 