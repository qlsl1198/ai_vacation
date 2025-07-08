import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  useTheme,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { getOAuthStatus } from '../config/oauth';

export default function OAuthTestScreen() {
  const theme = useTheme();
  const { user, loginWithGoogle, loginWithKakao, loginWithTest, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const oauthStatus = getOAuthStatus();

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

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('성공', '로그아웃되었습니다!');
    } catch (error) {
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={60} color={theme.colors.primary} />
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>
            OAuth 테스트 화면
          </Title>
          <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            OAuth 기능을 테스트하고 디버깅할 수 있습니다
          </Paragraph>
        </View>

        {/* 현재 사용자 정보 */}
        {user && (
          <Card style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                현재 로그인된 사용자
              </Title>
              <View style={styles.userInfo}>
                <Paragraph style={[styles.userText, { color: theme.colors.onSurface }]}>
                  이름: {user.name}
                </Paragraph>
                <Paragraph style={[styles.userText, { color: theme.colors.onSurface }]}>
                  이메일: {user.email}
                </Paragraph>
                <Chip 
                  mode="outlined" 
                  style={styles.providerChip}
                  textStyle={{ color: theme.colors.primary }}
                >
                  {user.provider} 로그인
                </Chip>
              </View>
              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                textColor={theme.colors.error}
              >
                로그아웃
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* OAuth 설정 상태 */}
        <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              OAuth 설정 상태
            </Title>
            <View style={styles.statusContainer}>
              <Chip 
                mode={oauthStatus.google ? "flat" : "outlined"}
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: oauthStatus.google ? theme.colors.primary : 'transparent',
                    borderColor: oauthStatus.google ? theme.colors.primary : theme.colors.outline
                  }
                ]}
                textStyle={{ 
                  color: oauthStatus.google ? 'white' : theme.colors.onSurfaceVariant 
                }}
              >
                Google OAuth {oauthStatus.google ? '설정됨' : '미설정'}
              </Chip>
              <Chip 
                mode={oauthStatus.kakao ? "flat" : "outlined"}
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: oauthStatus.kakao ? '#FEE500' : 'transparent',
                    borderColor: oauthStatus.kakao ? '#FEE500' : theme.colors.outline
                  }
                ]}
                textStyle={{ 
                  color: oauthStatus.kakao ? '#000000' : theme.colors.onSurfaceVariant 
                }}
              >
                Kakao OAuth {oauthStatus.kakao ? '설정됨' : '미설정'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* 실제 OAuth 로그인 */}
        <Card style={[styles.loginCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              실제 OAuth 로그인
            </Title>
            <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              환경 변수가 설정된 경우 실제 OAuth 로그인을 테스트할 수 있습니다
            </Paragraph>

            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              style={[
                styles.oauthButton, 
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
              Google OAuth 로그인
            </Button>

            <Button
              mode="outlined"
              onPress={handleKakaoLogin}
              style={[
                styles.oauthButton, 
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
              Kakao OAuth 로그인
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* 개발자 테스트 로그인 */}
        <Card style={[styles.testCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              🧪 개발자 테스트 로그인
            </Title>
            <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              OAuth 설정 없이도 기능을 테스트할 수 있습니다
            </Paragraph>

            <Button
              mode="outlined"
              onPress={() => handleTestLogin('google')}
              style={[styles.testButton, { borderColor: theme.colors.primary }]}
              textColor={theme.colors.primary}
              icon="bug"
              loading={isLoading}
              disabled={isLoading}
            >
              Google 테스트 로그인
            </Button>

            <Button
              mode="outlined"
              onPress={() => handleTestLogin('kakao')}
              style={[styles.testButton, { borderColor: theme.colors.primary }]}
              textColor={theme.colors.primary}
              icon="bug"
              loading={isLoading}
              disabled={isLoading}
            >
              Kakao 테스트 로그인
            </Button>
          </Card.Content>
        </Card>

        {/* 디버깅 정보 */}
        <Card style={[styles.debugCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              🔧 디버깅 정보
            </Title>
            <Paragraph style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
              • 개발 모드: {__DEV__ ? '활성화' : '비활성화'}{'\n'}
              • OAuth 설정: {oauthStatus.google || oauthStatus.kakao ? '일부 설정됨' : '미설정'}{'\n'}
              • 현재 사용자: {user ? `${user.name} (${user.provider})` : '로그인 안됨'}{'\n'}
              • 환경 변수: .env 파일에서 설정 필요
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  userCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userInfo: {
    marginBottom: 16,
  },
  userText: {
    fontSize: 14,
    marginBottom: 4,
  },
  providerChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  logoutButton: {
    borderColor: '#f44336',
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statusChip: {
    marginBottom: 8,
  },
  loginCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  oauthButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  testCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  testButton: {
    marginBottom: 8,
    paddingVertical: 6,
  },
  debugCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  debugText: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    marginVertical: 20,
  },
}); 