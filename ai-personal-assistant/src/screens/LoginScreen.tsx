import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { SocialAuthService } from '../auth/SocialAuthService';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState({ google: false, kakao: false });

  useEffect(() => {
    // OAuth 설정 상태 확인
    const status = SocialAuthService.getOAuthStatus();
    setOauthStatus(status);
  }, []);

  const handleGoogleLogin = async () => {
    if (!oauthStatus.google) {
      Alert.alert('OAuth 미설정', 'Google OAuth가 설정되지 않았습니다. 개발자에게 문의하세요.');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (Platform.OS === 'web') {
        // 웹에서는 시뮬레이션 사용
        result = await SocialAuthService.simulateSocialLogin('google');
      } else {
        result = await SocialAuthService.signInWithGoogle();
      }

      if (result.success && result.user) {
        await login(result.user);
        Alert.alert('성공', 'Google OAuth 로그인되었습니다!');
      } else {
        Alert.alert('오류', result.error || 'Google OAuth 로그인에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', 'Google OAuth 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (!oauthStatus.kakao) {
      Alert.alert('OAuth 미설정', 'Kakao OAuth가 설정되지 않았습니다. 개발자에게 문의하세요.');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (Platform.OS === 'web') {
        // 웹에서는 시뮬레이션 사용
        result = await SocialAuthService.simulateSocialLogin('kakao');
      } else {
        result = await SocialAuthService.signInWithKakao();
      }

      if (result.success && result.user) {
        await login(result.user);
        Alert.alert('성공', 'Kakao OAuth 로그인되었습니다!');
      } else {
        Alert.alert('오류', result.error || 'Kakao OAuth 로그인에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', 'Kakao OAuth 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const userData = {
        id: 'guest_' + Date.now(),
        email: 'guest@example.com',
        name: '게스트 사용자',
        provider: 'guest' as const,
      };
      
      await login(userData);
      Alert.alert('성공', '게스트로 로그인되었습니다!');
    } catch (error) {
      Alert.alert('오류', '게스트 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 로고 및 환영 메시지 */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person-circle" size={80} color="white" />
          </View>
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>
            AI 개인 비서
          </Title>
          <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            OAuth 소셜 로그인으로 안전하게 시작하세요
          </Paragraph>
        </View>

        {/* 로그인 카드 */}
        <Card style={[styles.loginCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              OAuth 로그인
            </Title>

            <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              안전한 OAuth 2.0 인증을 통해 서비스를 이용하세요
            </Paragraph>

            {/* 소셜 로그인 버튼들 */}
            <Title style={[styles.socialTitle, { color: theme.colors.onSurface }]}>
              OAuth 소셜 계정으로 로그인
            </Title>

            {/* Google OAuth 로그인 */}
            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              style={[
                styles.socialButton, 
                { 
                  borderColor: oauthStatus.google ? '#4285F4' : theme.colors.outline,
                  opacity: oauthStatus.google ? 1 : 0.5
                }
              ]}
              textColor={oauthStatus.google ? '#4285F4' : theme.colors.onSurfaceVariant}
              icon="logo-google"
              loading={isLoading}
              disabled={isLoading || !oauthStatus.google}
            >
              {oauthStatus.google ? 'Google OAuth로 계속하기' : 'Google OAuth 미설정'}
            </Button>

            {/* Kakao OAuth 로그인 */}
            <Button
              mode="outlined"
              onPress={handleKakaoLogin}
              style={[
                styles.socialButton, 
                { 
                  borderColor: oauthStatus.kakao ? '#FEE500' : theme.colors.outline,
                  backgroundColor: oauthStatus.kakao ? '#FEE500' : 'transparent',
                  opacity: oauthStatus.kakao ? 1 : 0.5
                }
              ]}
              textColor={oauthStatus.kakao ? '#000000' : theme.colors.onSurfaceVariant}
              icon="logo-google"
              loading={isLoading}
              disabled={isLoading || !oauthStatus.kakao}
            >
              {oauthStatus.kakao ? 'Kakao OAuth로 계속하기' : 'Kakao OAuth 미설정'}
            </Button>

            <Divider style={styles.divider} />

            {/* 게스트 로그인 */}
            <Button
              mode="text"
              onPress={handleGuestLogin}
              style={styles.guestButton}
              loading={isLoading}
              disabled={isLoading}
            >
              게스트로 시작하기
            </Button>
          </Card.Content>
        </Card>

        {/* 보안 정보 */}
        <Card style={[styles.securityCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.securityTitle, { color: theme.colors.onSurface }]}>
              🔒 OAuth 2.0 보안 정보
            </Title>
            <Paragraph style={[styles.securityText, { color: theme.colors.onSurfaceVariant }]}>
              • OAuth 2.0 표준을 통한 안전한 인증{'\n'}
              • 개인정보는 소셜 플랫폼에서만 관리{'\n'}
              • 앱에서는 민감한 정보를 저장하지 않음{'\n'}
              • 이메일/비밀번호 로그인은 지원하지 않음
            </Paragraph>
          </Card.Content>
        </Card>

        {/* 앱 정보 */}
        <View style={styles.footer}>
          <Paragraph style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            AI 개인 비서 v1.0.0 - OAuth 전용
          </Paragraph>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  loginCard: {
    borderRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  guestButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  securityCard: {
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
}); 