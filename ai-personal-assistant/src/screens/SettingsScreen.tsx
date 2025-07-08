import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Button,
  Divider,
  TextInput,
  Portal,
  Modal,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthContext';
import UserGuide from '../components/UserGuide';
import { apiService } from '../services/api';
import { settingsService, Settings } from '../services/settings';
import { dataManagerService } from '../services/dataManager';
import { notificationService } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    voiceRecognition: true,
    autoSave: true,
    language: 'ko',
    aiModel: 'gpt-3.5-turbo',
  });

  const [visible, setVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, []);

  // 설정 변경 감지
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const currentSettings = await settingsService.getSettings();
        if (currentSettings.language !== settings.language || 
            currentSettings.aiModel !== settings.aiModel ||
            currentSettings.notifications !== settings.notifications ||
            currentSettings.voiceRecognition !== settings.voiceRecognition ||
            currentSettings.autoSave !== settings.autoSave) {
          setSettings(currentSettings);
        }
      } catch (error) {
        console.error('설정 확인 실패:', error);
      }
    };

    const interval = setInterval(checkSettings, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const initializeSettings = async () => {
    try {
      await settingsService.initialize();
      const savedSettings = await settingsService.getSettings();
      setSettings(savedSettings);
      await checkApiKeyStatus();
    } catch (error) {
      console.error('설정 초기화 실패:', error);
    }
  };

  const checkApiKeyStatus = async () => {
    await apiService.initialize();
    setIsApiKeySet(apiService.isApiKeySet());
  };

  const showModal = () => {
    // 기존 API 키가 있으면 모달에 표시
    if (isApiKeySet) {
      setApiKey('••••••••••••••••••••••••••••••••');
    } else {
      setApiKey('');
    }
    setVisible(true);
  };
  
  const hideModal = () => {
    setVisible(false);
    setApiKey('');
  };

  const showUserGuideModal = () => setShowUserGuide(true);
  const hideUserGuideModal = () => setShowUserGuide(false);

  const toggleSetting = async (key: keyof Settings) => {
    try {
      const newValue = !settings[key];
      const newSettings = { ...settings, [key]: newValue };
      setSettings(newSettings);
      
      // 설정 저장
      await settingsService.updateSettings({ [key]: newValue });
      
      // 특정 설정에 대한 추가 처리
      if (key === 'notifications') {
        if (newValue) {
          try {
            await notificationService.initialize();
            Alert.alert('알림 활성화', '알림이 활성화되었습니다.');
          } catch (error) {
            Alert.alert('알림 권한', '알림 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
            // 설정을 다시 비활성화
            setSettings(prev => ({ ...prev, [key]: false }));
            await settingsService.updateSettings({ [key]: false });
          }
        } else {
          Alert.alert('알림 비활성화', '알림이 비활성화되었습니다.');
        }
      } else if (key === 'voiceRecognition') {
        if (newValue) {
          Alert.alert('음성 인식 활성화', '음성 인식이 활성화되었습니다.');
        } else {
          Alert.alert('음성 인식 비활성화', '음성 인식이 비활성화되었습니다.');
        }
      } else if (key === 'autoSave') {
        if (newValue) {
          Alert.alert('자동 저장 활성화', '자동 저장이 활성화되었습니다.');
        } else {
          Alert.alert('자동 저장 비활성화', '자동 저장이 비활성화되었습니다.');
        }
      }
    } catch (error) {
      console.error('설정 변경 실패:', error);
      Alert.alert('오류', '설정 변경 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    const confirmLogout = () => {
      const message = settings.language === 'ko' 
        ? '정말로 로그아웃하시겠습니까? 모든 데이터는 유지됩니다.'
        : 'Are you sure you want to logout? All data will be preserved.';
      
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(message)) {
          performLogout();
        }
      } else {
        Alert.alert(
          settings.language === 'ko' ? '로그아웃' : 'Logout',
          message,
          [
            { text: settings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
            {
              text: settings.language === 'ko' ? '로그아웃' : 'Logout',
              style: 'destructive',
              onPress: performLogout,
            },
          ]
        );
      }
    };

    const performLogout = async () => {
      try {
        await logout();
        const successMessage = settings.language === 'ko' ? '로그아웃되었습니다.' : 'You have been logged out.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(successMessage);
          // 웹 환경에서는 페이지 새로고침
          window.location.reload();
        } else {
          Alert.alert(settings.language === 'ko' ? '완료' : 'Complete', successMessage);
        }
      } catch (error) {
        console.error('로그아웃 실패:', error);
        const errorMessage = settings.language === 'ko' ? '로그아웃 중 오류가 발생했습니다.' : 'An error occurred during logout.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('오류: ' + errorMessage);
        } else {
          Alert.alert('오류', errorMessage);
        }
      }
    };

    confirmLogout();
  };

  const saveApiKey = async () => {
    if (!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••') {
      Alert.alert(
        '오류', 
        settings.language === 'ko' ? '유효한 API 키를 입력해주세요.' : 'Please enter a valid API key.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // API 키를 저장
      await apiService.setApiKey(apiKey.trim());
      setIsApiKeySet(true);
      
      // API 키 유효성 검증 (간단한 테스트 요청)
      const testResponse = await apiService.sendTextMessage('안녕하세요', '당신은 도움이 되는 AI 비서입니다.', 'gpt-3.5-turbo');
      
      if (testResponse.success) {
        Alert.alert(
          settings.language === 'ko' ? '성공' : 'Success', 
          settings.language === 'ko' 
            ? 'API 키가 성공적으로 저장되고 검증되었습니다. 이제 AI 기능을 사용할 수 있습니다.'
            : 'API key has been successfully saved and verified. You can now use AI features.'
        );
      } else {
        Alert.alert(
          settings.language === 'ko' ? '경고' : 'Warning', 
          settings.language === 'ko' 
            ? 'API 키가 저장되었지만 검증에 실패했습니다. 키가 올바른지 확인해주세요.'
            : 'API key was saved but verification failed. Please check if the key is correct.'
        );
      }
      
      hideModal();
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      Alert.alert(
        '오류', 
        settings.language === 'ko' ? 'API 키 저장 중 오류가 발생했습니다.' : 'An error occurred while saving the API key.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeApiKey = () => {
    const confirmDelete = () => {
      const message = settings.language === 'ko' 
        ? '저장된 API 키를 삭제하시겠습니까? AI 기능을 사용하려면 새로운 API 키를 설정해야 합니다.'
        : 'Are you sure you want to delete the saved API key? You will need to set a new API key to use AI features.';
      
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(message)) {
          performDelete();
        }
      } else {
        Alert.alert(
          settings.language === 'ko' ? 'API 키 삭제' : 'Delete API Key',
          message,
          [
            { text: settings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
            {
              text: settings.language === 'ko' ? '삭제' : 'Delete',
              style: 'destructive',
              onPress: performDelete,
            },
          ]
        );
      }
    };

    const performDelete = async () => {
      try {
        await apiService.removeApiKey();
        setIsApiKeySet(false);
        const successMessage = settings.language === 'ko' 
          ? 'API 키가 삭제되었습니다. AI 기능을 사용하려면 새로운 API 키를 설정해주세요.'
          : 'API key has been deleted. Please set a new API key to use AI features.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(successMessage);
        } else {
          Alert.alert(settings.language === 'ko' ? '완료' : 'Complete', successMessage);
        }
      } catch (error) {
        console.error('API 키 삭제 실패:', error);
        const errorMessage = settings.language === 'ko' ? 'API 키 삭제 중 오류가 발생했습니다.' : 'An error occurred while deleting the API key.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('오류: ' + errorMessage);
        } else {
          Alert.alert('오류', errorMessage);
        }
      }
    };

    confirmDelete();
  };

  const resetSettings = () => {
    Alert.alert(
      settings.language === 'ko' ? '설정 초기화' : 'Reset Settings',
      settings.language === 'ko' 
        ? '모든 설정을 기본값으로 되돌리시겠습니까? 이 작업은 되돌릴 수 없습니다.'
        : 'Are you sure you want to reset all settings to default? This action cannot be undone.',
      [
        { text: settings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
        {
          text: settings.language === 'ko' ? '초기화' : 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await settingsService.resetSettings();
              const defaultSettings = await settingsService.getSettings();
              setSettings(defaultSettings);
              
              // API 키 상태도 다시 확인
              await checkApiKeyStatus();
              
              Alert.alert(
                settings.language === 'ko' ? '완료' : 'Complete', 
                settings.language === 'ko' ? '모든 설정이 기본값으로 초기화되었습니다.' : 'All settings have been reset to default.'
              );
            } catch (error) {
              console.error('설정 초기화 실패:', error);
              Alert.alert(
                '오류', 
                settings.language === 'ko' ? '설정 초기화 중 오류가 발생했습니다.' : 'An error occurred while resetting settings.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      setIsLoading(true);
      await dataManagerService.exportData();
      Alert.alert(
        settings.language === 'ko' ? '성공' : 'Success', 
        settings.language === 'ko' ? '데이터가 성공적으로 내보내졌습니다.' : 'Data has been successfully exported.'
      );
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      Alert.alert(
        '오류', 
        settings.language === 'ko' 
          ? '데이터 내보내기 중 오류가 발생했습니다. 웹 환경에서는 파일 다운로드가 제한될 수 있습니다.'
          : 'An error occurred while exporting data. File download may be limited in web environment.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const importData = async () => {
    try {
      setIsLoading(true);
      await dataManagerService.importData();
      
      // 설정 다시 로드
      const savedSettings = await settingsService.getSettings();
      setSettings(savedSettings);
      
      Alert.alert(
        settings.language === 'ko' ? '성공' : 'Success', 
        settings.language === 'ko' ? '데이터가 성공적으로 가져와졌습니다.' : 'Data has been successfully imported.'
      );
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      Alert.alert(
        '오류', 
        settings.language === 'ko' 
          ? '데이터 가져오기 중 오류가 발생했습니다. 웹 환경에서는 파일 선택이 제한될 수 있습니다.'
          : 'An error occurred while importing data. File selection may be limited in web environment.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = () => {
    const confirmDelete = () => {
      const message = settings.language === 'ko' 
        ? '정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
        : 'Are you sure you want to delete all data? This action cannot be undone.';
      
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(message)) {
          performDelete();
        }
      } else {
        Alert.alert(
          settings.language === 'ko' ? '모든 데이터 삭제' : 'Delete All Data',
          message,
          [
            { text: settings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
            {
              text: settings.language === 'ko' ? '삭제' : 'Delete',
              style: 'destructive',
              onPress: performDelete,
            },
          ]
        );
      }
    };

    const performDelete = async () => {
      try {
        setIsLoading(true);
        await dataManagerService.clearAllData();
        
        // 설정 초기화
        await settingsService.resetSettings();
        const defaultSettings = await settingsService.getSettings();
        setSettings(defaultSettings);
        
        const successMessage = settings.language === 'ko' ? '모든 데이터가 삭제되었습니다.' : 'All data has been deleted.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(successMessage);
          // 웹 환경에서는 페이지 새로고침
          window.location.reload();
        } else {
          Alert.alert(settings.language === 'ko' ? '완료' : 'Complete', successMessage);
        }
      } catch (error) {
        console.error('데이터 삭제 실패:', error);
        const errorMessage = settings.language === 'ko' ? '데이터 삭제 중 오류가 발생했습니다.' : 'An error occurred while deleting data.';
        
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('오류: ' + errorMessage);
        } else {
          Alert.alert('오류', errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    confirmDelete();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 계정 정보 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {settings.language === 'ko' ? '계정 정보' : 'Account Information'}
            </Title>
            <List.Item
              title={user?.name || (settings.language === 'ko' ? '사용자' : 'User')}
              description={user?.email}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="account" />}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '로그아웃' : 'Logout'}
              description={settings.language === 'ko' ? '현재 계정에서 로그아웃합니다' : 'Sign out from current account'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleLogout}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* 일반 설정 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {settings.language === 'ko' ? '일반 설정' : 'General Settings'}
            </Title>
            <List.Item
              title={settings.language === 'ko' ? '알림' : 'Notifications'}
              description={settings.language === 'ko' ? '푸시 알림을 받습니다' : 'Receive push notifications'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={() => toggleSetting('notifications')}
                />
              )}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '음성 인식' : 'Voice Recognition'}
              description={settings.language === 'ko' ? '음성 명령을 활성화합니다' : 'Enable voice commands'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="microphone" />}
              right={() => (
                <Switch
                  value={settings.voiceRecognition}
                  onValueChange={() => toggleSetting('voiceRecognition')}
                />
              )}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '자동 저장' : 'Auto Save'}
              description={settings.language === 'ko' ? '변경사항을 자동으로 저장합니다' : 'Automatically save changes'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="content-save" />}
              right={() => (
                <Switch
                  value={settings.autoSave}
                  onValueChange={() => toggleSetting('autoSave')}
                />
              )}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '다크 모드' : 'Dark Mode'}
              description={settings.language === 'ko' ? '어두운 테마를 사용합니다' : 'Use dark theme'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* AI 설정 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {settings.language === 'ko' ? 'AI 설정' : 'AI Settings'}
            </Title>
            <List.Item
              title={settings.language === 'ko' ? '언어' : 'Language'}
              description={settings.language === 'ko' ? '한국어' : 'English'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Text style={[styles.settingValueText, { color: theme.colors.primary }]}>
                    {settings.language === 'ko' ? '한국어' : 'English'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={async () => {
                try {
                  setIsLoading(true);
                  const newLanguage = settings.language === 'ko' ? 'en' : 'ko';
                  await settingsService.updateSettings({ language: newLanguage });
                  setSettings(prev => ({ ...prev, language: newLanguage }));
                  
                  Alert.alert(
                    settings.language === 'ko' ? '언어 변경' : 'Language Changed', 
                    newLanguage === 'ko' ? '한국어로 변경되었습니다.' : 'Language changed to English.',
                    [
                      {
                        text: settings.language === 'ko' ? '확인' : 'OK',
                        onPress: () => {
                          // 앱 전체 언어 변경을 위한 추가 처리
                          console.log('언어가 변경되었습니다:', newLanguage);
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('언어 변경 실패:', error);
                  Alert.alert('오류', settings.language === 'ko' ? '언어 변경 중 오류가 발생했습니다.' : 'An error occurred while changing language.');
                } finally {
                  setIsLoading(false);
                }
              }}
              style={styles.listItem}
              disabled={isLoading}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? 'AI 모델' : 'AI Model'}
              description={settings.language === 'ko' ? `현재 사용 중: ${settings.aiModel}` : `Currently using: ${settings.aiModel}`}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="robot" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Text style={[styles.settingValueText, { color: theme.colors.primary }]}>
                    {settings.aiModel}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={async () => {
                try {
                  setIsLoading(true);
                  const newModel = settings.aiModel === 'gpt-3.5-turbo' ? 'gpt-4' : 'gpt-3.5-turbo';
                  await settingsService.updateSettings({ aiModel: newModel });
                  setSettings(prev => ({ ...prev, aiModel: newModel }));
                  
                  Alert.alert(
                    settings.language === 'ko' ? 'AI 모델 변경' : 'AI Model Changed', 
                    settings.language === 'ko' 
                      ? `AI 모델이 ${newModel}로 변경되었습니다.\n\n${newModel === 'gpt-4' ? 'GPT-4는 더 정확하고 창의적인 응답을 제공하지만 응답 속도가 느릴 수 있습니다.' : 'GPT-3.5-turbo는 빠른 응답을 제공하며 대부분의 작업에 충분합니다.'}`
                      : `AI model has been changed to ${newModel}.\n\n${newModel === 'gpt-4' ? 'GPT-4 provides more accurate and creative responses but may be slower.' : 'GPT-3.5-turbo provides fast responses and is sufficient for most tasks.'}`,
                    [
                      {
                        text: settings.language === 'ko' ? '확인' : 'OK',
                        onPress: () => {
                          console.log('AI 모델이 변경되었습니다:', newModel);
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('AI 모델 변경 실패:', error);
                  Alert.alert('오류', settings.language === 'ko' ? 'AI 모델 변경 중 오류가 발생했습니다.' : 'An error occurred while changing AI model.');
                } finally {
                  setIsLoading(false);
                }
              }}
              style={styles.listItem}
              disabled={isLoading}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? 'API 키 설정' : 'API Key Settings'}
              description={isApiKeySet 
                ? (settings.language === 'ko' ? "API 키가 설정되어 있습니다" : "API key is set")
                : (settings.language === 'ko' ? "AI 서비스 API 키를 설정합니다" : "Set AI service API key")
              }
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: isApiKeySet ? theme.colors.primary : theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="key" color={isApiKeySet ? theme.colors.primary : undefined} />}
              onPress={showModal}
              style={styles.listItem}
            />
            {isApiKeySet && (
              <>
                <Divider style={styles.divider} />
                <List.Item
                  title={settings.language === 'ko' ? 'API 키 삭제' : 'Delete API Key'}
                  description={settings.language === 'ko' ? '저장된 API 키를 삭제합니다' : 'Delete saved API key'}
                  titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
                  descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
                  left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
                  onPress={removeApiKey}
                  style={styles.listItem}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* 데이터 관리 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {settings.language === 'ko' ? '데이터 관리' : 'Data Management'}
            </Title>
            <List.Item
              title={settings.language === 'ko' ? '데이터 내보내기' : 'Export Data'}
              description={settings.language === 'ko' ? '모든 데이터를 백업합니다' : 'Backup all data'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={exportData}
              style={styles.listItem}
              disabled={isLoading}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '데이터 가져오기' : 'Import Data'}
              description={settings.language === 'ko' ? '백업된 데이터를 복원합니다' : 'Restore backed up data'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="upload" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={importData}
              style={styles.listItem}
              disabled={isLoading}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '모든 데이터 삭제' : 'Delete All Data'}
              description={settings.language === 'ko' ? '모든 데이터를 영구적으로 삭제합니다' : 'Permanently delete all data'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
                </View>
              )}
              onPress={clearAllData}
              style={styles.listItem}
              disabled={isLoading}
            />
          </Card.Content>
        </Card>

        {/* 기타 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {settings.language === 'ko' ? '기타' : 'Other'}
            </Title>
            <List.Item
              title={settings.language === 'ko' ? '사용 가이드' : 'User Guide'}
              description={settings.language === 'ko' ? '앱 사용법을 다시 확인합니다' : 'Review app usage guide'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={showUserGuideModal}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '설정 초기화' : 'Reset Settings'}
              description={settings.language === 'ko' ? '모든 설정을 기본값으로 되돌립니다' : 'Reset all settings to default'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="refresh" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={resetSettings}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title={settings.language === 'ko' ? '앱 정보' : 'App Info'}
              description={settings.language === 'ko' ? '버전 1.0.0' : 'Version 1.0.0'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => (
                <View style={styles.settingValue}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              onPress={() => Alert.alert(
                settings.language === 'ko' ? '앱 정보' : 'App Info', 
                settings.language === 'ko' 
                  ? 'AI 개인 비서 v1.0.0\n\n개발자: AI Assistant Team\n\n이 앱은 OpenAI의 GPT 모델을 사용하여 개인 비서 기능을 제공합니다.'
                  : 'AI Personal Assistant v1.0.0\n\nDeveloper: AI Assistant Team\n\nThis app provides personal assistant features using OpenAI\'s GPT models.'
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* API Key Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {isApiKeySet 
              ? (settings.language === 'ko' ? 'API 키 수정' : 'Edit API Key')
              : (settings.language === 'ko' ? 'API 키 설정' : 'Set API Key')
            }
          </Title>
          <Paragraph style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            {settings.language === 'ko' 
              ? 'OpenAI API 키를 입력하세요. 이 키는 안전하게 저장되며 AI 기능을 사용하는 데 필요합니다.'
              : 'Enter your OpenAI API key. This key will be stored securely and is required to use AI features.'
            }
          </Paragraph>
          <TextInput
            label={settings.language === 'ko' ? 'API 키' : 'API Key'}
            value={apiKey}
            onChangeText={setApiKey}
            mode="outlined"
            secureTextEntry={!isApiKeySet}
            style={styles.input}
            dense
            placeholder="sk-..."
            disabled={isLoading}
          />
          <View style={styles.modalButtons}>
            <Button onPress={hideModal} style={styles.modalButton} labelStyle={styles.modalButtonText} disabled={isLoading}>
              {settings.language === 'ko' ? '취소' : 'Cancel'}
            </Button>
            <Button
              mode="contained"
              onPress={saveApiKey}
              style={styles.modalButton}
              disabled={!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••' || isLoading}
              labelStyle={styles.modalButtonText}
              loading={isLoading}
            >
              {isApiKeySet 
                ? (settings.language === 'ko' ? '수정' : 'Update')
                : (settings.language === 'ko' ? '저장' : 'Save')
              }
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* User Guide */}
      <UserGuide 
        visible={showUserGuide} 
        onClose={hideUserGuideModal}
        isFromSettings={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Math.min(width * 0.04, 16),
    paddingBottom: Math.min(height * 0.1, 80),
  },
  settingsCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: Math.min(width * 0.04, 16),
  },
  cardTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
    marginBottom: Math.min(height * 0.01, 8),
  },
  listItem: {
    minHeight: Math.min(height * 0.06, 60),
    paddingVertical: Math.min(height * 0.005, 4),
  },
  listItemTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  listItemDescription: {
    fontSize: Math.min(width * 0.035, 14),
    marginTop: 2,
  },
  divider: {
    marginVertical: Math.min(height * 0.005, 4),
  },
  modal: {
    padding: Math.min(width * 0.05, 20),
    margin: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    maxWidth: Math.min(width * 0.9, 400),
  },
  modalTitle: {
    marginBottom: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
  },
  modalDescription: {
    marginBottom: Math.min(height * 0.02, 16),
    fontSize: Math.min(width * 0.035, 14),
    lineHeight: Math.min(width * 0.05, 20),
  },
  input: {
    marginBottom: Math.min(height * 0.02, 16),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Math.min(width * 0.02, 8),
  },
  modalButton: {
    minWidth: Math.min(width * 0.2, 80),
    minHeight: Math.min(height * 0.05, 40),
  },
  modalButtonText: {
    fontSize: Math.min(width * 0.035, 14),
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: '500',
    marginRight: Math.min(width * 0.02, 8),
  },
}); 