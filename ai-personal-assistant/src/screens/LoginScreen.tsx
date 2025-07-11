import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Image,
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

export default function LoginScreen() {
  const theme = useTheme();
  const { loginWithGoogle, loginWithKakao, loginWithTest, login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      Alert.alert('성공', 'Google OAuth 로그인되었습니다!');
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      Alert.alert('오류', 'Google 로그인에 실패했습니다. 개발자 모드에서 테스트 로그인을 사용해보세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithKakao();
      Alert.alert('성공', 'Kakao OAuth 로그인되었습니다!');
    } catch (error) {
      console.error('Kakao 로그인 오류:', error);
      Alert.alert('오류', 'Kakao 로그인에 실패했습니다. 개발자 모드에서 테스트 로그인을 사용해보세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async (provider: 'google' | 'kakao') => {
    setIsLoading(true);
    try {
      await loginWithTest(provider);
      Alert.alert('성공', `${provider === 'google' ? 'Google' : 'Kakao'} 테스트 로그인되었습니다!`);
    } catch (error) {
      console.error('테스트 로그인 오류:', error);
      Alert.alert('오류', '테스트 로그인에 실패했습니다.');
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
                  borderColor: '#4285F4',
                  opacity: isLoading ? 0.5 : 1
                }
              ]}
              textColor="#4285F4"
              icon={() => (
                <Image
                  source={require('../../assets/google_logo.png')}
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  resizeMode="contain"
                />
              )}
              loading={isLoading}
              disabled={isLoading}
            >
              Google OAuth로 계속하기
            </Button>

            {/* Kakao OAuth 로그인 */}
            <Button
              mode="outlined"
              onPress={handleKakaoLogin}
              style={[
                styles.socialButton, 
                { 
                  borderColor: '#FEE500',
                  backgroundColor: '#FEE500',
                  opacity: isLoading ? 0.5 : 1
                }
              ]}
              textColor="#000000"
              icon={() => (
                <Image
                  source={require('../../assets/kakao_logo.png')}
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  resizeMode="contain"
                />
              )}
              loading={isLoading}
              disabled={isLoading}
            >
              Kakao OAuth로 계속하기
            </Button>

            <Divider style={styles.divider} />

            {/* 게스트 로그인 */}
            <Button
              mode="text"
              onPress={handleGuestLogin}
              style={styles.guestButton}
              loading={isLoading}
              disabled={false}
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
              • 이메일/비밀번호 로그인은 지원하지 않음{'\n'}
              • 개발자 테스트 로그인으로 기능 확인 가능
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
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  testButton: {
    marginBottom: 8,
    paddingVertical: 6,
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