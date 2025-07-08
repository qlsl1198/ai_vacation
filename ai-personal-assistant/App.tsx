import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Platform, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { apiService } from './src/services/api';
import { settingsService } from './src/services/settings';
import { notificationService } from './src/services/notificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import CameraScreen from './src/screens/CameraScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const { width, height } = Dimensions.get('window');

const screens = [
  { name: '홈', component: HomeScreen, icon: 'home' as keyof typeof Ionicons.glyphMap },
  { name: '채팅', component: ChatScreen, icon: 'chatbubbles' as keyof typeof Ionicons.glyphMap },
  { name: '음성', component: VoiceScreen, icon: 'mic' as keyof typeof Ionicons.glyphMap },
  { name: '카메라', component: CameraScreen, icon: 'camera' as keyof typeof Ionicons.glyphMap },
  { name: '설정', component: SettingsScreen, icon: 'settings' as keyof typeof Ionicons.glyphMap },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const { theme } = useTheme();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const ActiveScreen = screens[activeTab].component;

  // 언어별 탭 이름
  const getTabNames = (language: string) => {
    if (language === 'ko') {
      return ['홈', '채팅', '음성', '카메라', '설정'];
    } else {
      return ['Home', 'Chat', 'Voice', 'Camera', 'Settings'];
    }
  };

  useEffect(() => {
    // 앱 시작 시 서비스들 초기화
    const initializeApp = async () => {
      try {
        // API 서비스 초기화
        await apiService.initialize();
        
        // 설정 서비스 초기화
        await settingsService.initialize();
        
        // 언어 설정 로드
        const settings = await settingsService.getSettings();
        setCurrentLanguage(settings.language);
        
        // 알림 서비스 초기화 (알림이 활성화된 경우에만)
        const notificationsEnabled = settingsService.getSetting('notifications');
        if (notificationsEnabled) {
          try {
            await notificationService.initialize();
          } catch (error) {
            console.log('알림 서비스 초기화 실패 (권한 없음):', error);
          }
        }
      } catch (error) {
        console.error('앱 초기화 오류:', error);
      }
    };
    
    initializeApp();
  }, []);

  // 설정 변경 감지를 위한 이벤트 리스너
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.language !== currentLanguage) {
          setCurrentLanguage(settings.language);
        }
      } catch (error) {
        console.error('설정 확인 실패:', error);
      }
    };

    // 주기적으로 설정 확인 (더 나은 방법은 이벤트 시스템을 구현하는 것)
    const interval = setInterval(checkSettings, 1000);
    return () => clearInterval(interval);
  }, [currentLanguage]);

  const tabNames = getTabNames(currentLanguage);

  // 로딩 중이거나 인증되지 않은 경우 로그인 화면 표시
  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar barStyle={theme.colors.onBackground === '#000000' ? 'light-content' : 'dark-content'} />
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={Math.min(width * 0.1, 40)} color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              {currentLanguage === 'ko' ? '로딩 중...' : 'Loading...'}
            </Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <PaperProvider theme={theme}>
        <LoginScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.colors.onBackground === '#000000' ? 'light-content' : 'dark-content'} />
        
        {/* 사용자 정보 헤더 */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person-circle" size={Math.min(width * 0.06, 32)} color={theme.colors.primary} />
            </View>
            <View style={styles.userTextContainer}>
              <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                {user?.name || '사용자'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                {user?.email}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={Math.min(width * 0.06, 24)} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ActiveScreen />
        </View>
        
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
          {screens.map((screen, index) => (
            <TouchableOpacity
              key={screen.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === index ? screen.icon : `${screen.icon}-outline` as keyof typeof Ionicons.glyphMap}
                size={Math.min(width * 0.06, 24)}
                color={activeTab === index ? theme.colors.primary : theme.colors.onSurface}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === index ? theme.colors.primary : theme.colors.onSurface }
                ]}
              >
                {tabNames[index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: Math.min(height * 0.02, 16),
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.min(width * 0.04, 16),
    paddingVertical: Math.min(height * 0.015, 12),
    borderBottomWidth: 1,
    minHeight: Math.min(height * 0.08, 60),
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: Math.min(width * 0.03, 12),
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Math.min(width * 0.03, 12),
    opacity: 0.7,
  },
  logoutButton: {
    padding: Math.min(width * 0.02, 8),
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? Math.min(height * 0.025, 20) : Math.min(height * 0.02, 16),
    paddingTop: Math.min(height * 0.012, 10),
    minHeight: Math.min(height * 0.1, 80),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.min(height * 0.01, 8),
    minHeight: 60,
  },
  tabText: {
    fontSize: Math.min(width * 0.03, 12),
    marginTop: Math.min(height * 0.005, 4),
    fontWeight: '500',
  },
});
