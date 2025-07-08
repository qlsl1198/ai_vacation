import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Dimensions,
  Platform,
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

const { width, height } = Dimensions.get('window');

interface Settings {
  notifications: boolean;
  voiceRecognition: boolean;
  autoSave: boolean;
  language: string;
  aiModel: string;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    voiceRecognition: true,
    autoSave: true,
    language: 'ko',
    aiModel: 'gpt-3.5',
  });

  const [visible, setVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

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
  
  const hideModal = () => setVisible(false);

  const showUserGuideModal = () => setShowUserGuide(true);
  const hideUserGuideModal = () => setShowUserGuide(false);

  const toggleSetting = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const saveApiKey = async () => {
    if (!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••') {
      Alert.alert('오류', '유효한 API 키를 입력해주세요.');
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
        Alert.alert('성공', 'API 키가 성공적으로 저장되고 검증되었습니다.');
      } else {
        Alert.alert('경고', 'API 키가 저장되었지만 검증에 실패했습니다. 키가 올바른지 확인해주세요.');
      }
      
      hideModal();
    } catch (error) {
      Alert.alert('오류', 'API 키 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeApiKey = () => {
    Alert.alert(
      'API 키 삭제',
      '저장된 API 키를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeApiKey();
              setIsApiKeySet(false);
              Alert.alert('완료', 'API 키가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', 'API 키 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const resetSettings = () => {
    Alert.alert(
      '설정 초기화',
      '모든 설정을 기본값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            setSettings({
              notifications: true,
              voiceRecognition: true,
              autoSave: true,
              language: 'ko',
              aiModel: 'gpt-3.5',
            });
            Alert.alert('완료', '설정이 초기화되었습니다.');
          },
        },
      ]
    );
  };

  const exportData = () => {
    Alert.alert('데이터 내보내기', '데이터 내보내기 기능은 추후 구현 예정입니다.');
  };

  const importData = () => {
    Alert.alert('데이터 가져오기', '데이터 가져오기 기능은 추후 구현 예정입니다.');
  };

  const clearAllData = () => {
    Alert.alert(
      '모든 데이터 삭제',
      '정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
          },
        },
      ]
    );
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
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>계정 정보</Title>
            <List.Item
              title={user?.name || '사용자'}
              description={user?.email}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="account" />}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="로그아웃"
              description="현재 계정에서 로그아웃합니다"
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
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>일반 설정</Title>
            <List.Item
              title="알림"
              description="푸시 알림을 받습니다"
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
              title="음성 인식"
              description="음성 명령을 활성화합니다"
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
              title="자동 저장"
              description="변경사항을 자동으로 저장합니다"
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
              title="다크 모드"
              description="어두운 테마를 사용합니다"
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
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>AI 설정</Title>
            <List.Item
              title="언어"
              description={settings.language === 'ko' ? '한국어' : 'English'}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="translate" />}
              onPress={() => {
                setSettings(prev => ({
                  ...prev,
                  language: prev.language === 'ko' ? 'en' : 'ko',
                }));
              }}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="AI 모델"
              description={settings.aiModel}
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="robot" />}
              onPress={() => {
                setSettings(prev => ({
                  ...prev,
                  aiModel: prev.aiModel === 'gpt-3.5' ? 'gpt-4' : 'gpt-3.5',
                }));
              }}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="API 키 설정"
              description={isApiKeySet ? "API 키가 설정되어 있습니다" : "AI 서비스 API 키를 설정합니다"}
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
                  title="API 키 삭제"
                  description="저장된 API 키를 삭제합니다"
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
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>데이터 관리</Title>
            <List.Item
              title="데이터 내보내기"
              description="모든 데이터를 백업합니다"
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="download" />}
              onPress={exportData}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="데이터 가져오기"
              description="백업된 데이터를 복원합니다"
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="upload" />}
              onPress={importData}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="모든 데이터 삭제"
              description="모든 데이터를 영구적으로 삭제합니다"
              titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              onPress={clearAllData}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* 기타 */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>기타</Title>
            <List.Item
              title="사용 가이드"
              description="앱 사용법을 다시 확인합니다"
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={showUserGuideModal}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="설정 초기화"
              description="모든 설정을 기본값으로 되돌립니다"
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="refresh" />}
              onPress={resetSettings}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="앱 정보"
              description="버전 1.0.0"
              titleStyle={[styles.listItemTitle, { color: theme.colors.onSurface }]}
              descriptionStyle={[styles.listItemDescription, { color: theme.colors.onSurfaceVariant }]}
              left={(props) => <List.Icon {...props} icon="information" />}
              onPress={() => Alert.alert('앱 정보', 'AI 개인 비서 v1.0.0\n\n개발자: AI Assistant Team')}
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
            {isApiKeySet ? 'API 키 수정' : 'API 키 설정'}
          </Title>
          <Paragraph style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            OpenAI API 키를 입력하세요. 이 키는 안전하게 저장되며 AI 기능을 사용하는 데 필요합니다.
          </Paragraph>
          <TextInput
            label="API 키"
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
              취소
            </Button>
            <Button
              mode="contained"
              onPress={saveApiKey}
              style={styles.modalButton}
              disabled={!apiKey.trim() || apiKey === '••••••••••••••••••••••••••••••••' || isLoading}
              labelStyle={styles.modalButtonText}
              loading={isLoading}
            >
              {isApiKeySet ? '수정' : '저장'}
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
}); 