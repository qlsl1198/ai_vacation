import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  List,
  Chip,
  TextInput,
  Portal,
  Modal,
  useTheme,
} from 'react-native-paper';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../components/VoiceRecorder';
import { apiService } from '../services/api';
import { settingsService } from '../services/settings';
import { notificationService } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

// 웹에서는 PermissionsAndroid를 사용하지 않음
let PermissionsAndroid: any = null;
if (Platform.OS !== 'web') {
  PermissionsAndroid = require('react-native').PermissionsAndroid;
}

interface VoiceMemo {
  id: string;
  text: string;
  timestamp: Date;
  category: 'memo' | 'reminder' | 'note';
}

export default function VoiceScreen() {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([]);
  const [inputText, setInputText] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<VoiceMemo | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [currentSettings, setCurrentSettings] = useState({
    voiceRecognition: true,
    language: 'ko',
    notifications: true,
  });

  useEffect(() => {
    initializeVoice();
  }, []);

  const initializeVoice = async () => {
    try {
      await checkApiKeyStatus();
      await loadSettings();
    } catch (error) {
      console.error('음성 화면 초기화 실패:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setCurrentSettings({
        voiceRecognition: settings.voiceRecognition,
        language: settings.language,
        notifications: settings.notifications,
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const checkApiKeyStatus = async () => {
    await apiService.initialize();
    setIsApiKeySet(apiService.isApiKeySet());
  };

  const showModal = (memo?: VoiceMemo) => {
    if (memo) {
      setSelectedMemo(memo);
      setInputText(memo.text);
    } else {
      setSelectedMemo(null);
      setInputText('');
    }
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setSelectedMemo(null);
    setInputText('');
  };

  const requestPermissions = async () => {
    // 웹에서는 권한 요청이 필요하지 않음
    if (Platform.OS === 'web') {
      return true;
    }
    
    if (Platform.OS === 'android' && PermissionsAndroid) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '음성 녹음 권한',
            message: '음성 메모를 녹음하기 위해 마이크 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    // 음성 인식 설정 확인
    if (!currentSettings.voiceRecognition) {
      Alert.alert(
        '음성 인식 비활성화',
        '음성 인식이 비활성화되어 있습니다. 설정에서 활성화해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 탭으로 이동하는 로직 (추후 구현)
            console.log('설정으로 이동');
          }}
        ]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('권한 필요', '음성 녹음을 위해 마이크 권한이 필요합니다.');
      return;
    }

    if (!isApiKeySet) {
      Alert.alert(
        'API 키 필요',
        '음성 인식 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 탭으로 이동하는 로직 (추후 구현)
            console.log('설정으로 이동');
          }}
        ]
      );
      return;
    }

    setShowVoiceRecorder(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setShowVoiceRecorder(false);
  };

  const handleVoiceResult = async (text: string) => {
    if (text.trim()) {
      const newMemo: VoiceMemo = {
        id: Date.now().toString(),
        text: text,
        timestamp: new Date(),
        category: 'memo',
      };
      setVoiceMemos(prev => [newMemo, ...prev]);
      setShowVoiceRecorder(false);
      
      // 알림이 활성화된 경우 음성 인식 완료 알림
      if (currentSettings.notifications) {
        try {
          await notificationService.notifyVoiceRecognitionComplete();
        } catch (error) {
          console.log('알림 전송 실패:', error);
        }
      }
      
      Alert.alert(
        '녹음 완료', 
        currentSettings.language === 'ko' 
          ? '음성 메모가 저장되었습니다.' 
          : 'Voice memo has been saved.'
      );
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const language = currentSettings.language === 'ko' ? 'ko-KR' : 'en-US';
      await Speech.speak(text, {
        language: language,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const saveMemo = () => {
    if (inputText.trim()) {
      if (selectedMemo) {
        // 기존 메모 수정
        setVoiceMemos(prev =>
          prev.map(memo =>
            memo.id === selectedMemo.id
              ? { ...memo, text: inputText }
              : memo
          )
        );
      } else {
        // 새 메모 추가
        const newMemo: VoiceMemo = {
          id: Date.now().toString(),
          text: inputText,
          timestamp: new Date(),
          category: 'memo',
        };
        setVoiceMemos(prev => [newMemo, ...prev]);
      }
      hideModal();
    }
  };

  const deleteMemo = (id: string) => {
    Alert.alert(
      currentSettings.language === 'ko' ? '메모 삭제' : 'Delete Memo',
      currentSettings.language === 'ko' 
        ? '이 메모를 삭제하시겠습니까?' 
        : 'Are you sure you want to delete this memo?',
      [
        { text: currentSettings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
        {
          text: currentSettings.language === 'ko' ? '삭제' : 'Delete',
          style: 'destructive',
          onPress: () => {
            setVoiceMemos(prev => prev.filter(memo => memo.id !== id));
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reminder':
        return theme.colors.error;
      case 'note':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reminder':
        return 'alarm';
      case 'note':
        return 'note';
      default:
        return 'mic';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 음성 인식 상태 */}
        <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {currentSettings.language === 'ko' ? '음성 인식 상태' : 'Voice Recognition Status'}
            </Title>
            <View style={styles.statusContainer}>
              <Chip
                icon={currentSettings.voiceRecognition ? 'check-circle' : 'close-circle'}
                mode="outlined"
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: currentSettings.voiceRecognition 
                      ? theme.colors.primaryContainer 
                      : theme.colors.errorContainer 
                  }
                ]}
                textStyle={{ 
                  color: currentSettings.voiceRecognition 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onErrorContainer 
                }}
              >
                {currentSettings.voiceRecognition 
                  ? (currentSettings.language === 'ko' ? '활성화' : 'Enabled')
                  : (currentSettings.language === 'ko' ? '비활성화' : 'Disabled')
                }
              </Chip>
              {!isApiKeySet && (
                <Chip
                  icon="alert-circle"
                  mode="outlined"
                  style={[styles.statusChip, { backgroundColor: theme.colors.errorContainer }]}
                  textStyle={{ color: theme.colors.onErrorContainer }}
                >
                  {currentSettings.language === 'ko' ? 'API 키 필요' : 'API Key Required'}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 음성 메모 목록 */}
        <Card style={[styles.memosCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {currentSettings.language === 'ko' ? '음성 메모' : 'Voice Memos'}
            </Title>
            {voiceMemos.length === 0 ? (
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {currentSettings.language === 'ko' 
                  ? '음성 메모가 없습니다. 녹음 버튼을 눌러 새로운 메모를 만들어보세요.' 
                  : 'No voice memos yet. Tap the record button to create a new memo.'
                }
              </Paragraph>
            ) : (
              voiceMemos.map((memo) => (
                <List.Item
                  key={memo.id}
                  title={memo.text}
                  description={memo.timestamp.toLocaleString(
                    currentSettings.language === 'ko' ? 'ko-KR' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                  titleStyle={[styles.memoTitle, { color: theme.colors.onSurface }]}
                  descriptionStyle={[styles.memoDescription, { color: theme.colors.onSurfaceVariant }]}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon={getCategoryIcon(memo.category)} 
                      color={getCategoryColor(memo.category)}
                    />
                  )}
                  right={(props) => (
                    <View style={styles.memoActions}>
                      <Button
                        mode="text"
                        onPress={() => speakText(memo.text)}
                        disabled={isSpeaking}
                        icon={isSpeaking ? 'stop' : 'volume-high'}
                        style={styles.actionButton}
                      >
                        {isSpeaking ? '정지' : '재생'}
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => showModal(memo)}
                        icon="pencil"
                        style={styles.actionButton}
                      >
                        편집
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => deleteMemo(memo.id)}
                        icon="delete"
                        style={styles.actionButton}
                      >
                        삭제
                      </Button>
                    </View>
                  )}
                  style={styles.memoItem}
                />
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 녹음 버튼 */}
      <FAB
        style={[
          styles.fab,
          { 
            backgroundColor: currentSettings.voiceRecognition && isApiKeySet 
              ? theme.colors.primary 
              : theme.colors.onSurfaceVariant 
          }
        ]}
        icon="microphone"
        onPress={startRecording}
        disabled={!currentSettings.voiceRecognition || !isApiKeySet}
      />

      {/* 음성 녹음 모달 */}
      <Portal>
        <Modal
          visible={showVoiceRecorder}
          onDismiss={() => setShowVoiceRecorder(false)}
          contentContainerStyle={[styles.voiceModal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {currentSettings.language === 'ko' ? '음성 녹음' : 'Voice Recording'}
          </Title>
          <VoiceRecorder onResult={handleVoiceResult} />
          <Button
            mode="outlined"
            onPress={() => setShowVoiceRecorder(false)}
            style={styles.cancelButton}
          >
            {currentSettings.language === 'ko' ? '취소' : 'Cancel'}
          </Button>
        </Modal>
      </Portal>

      {/* 메모 편집 모달 */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {selectedMemo 
              ? (currentSettings.language === 'ko' ? '메모 편집' : 'Edit Memo')
              : (currentSettings.language === 'ko' ? '새 메모' : 'New Memo')
            }
          </Title>
          <TextInput
            label={currentSettings.language === 'ko' ? '메모 내용' : 'Memo content'}
            value={inputText}
            onChangeText={setInputText}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.modalInput}
          />
          <View style={styles.modalButtons}>
            <Button onPress={hideModal} style={styles.modalButton}>
              {currentSettings.language === 'ko' ? '취소' : 'Cancel'}
            </Button>
            <Button
              mode="contained"
              onPress={saveMemo}
              style={styles.modalButton}
              disabled={!inputText.trim()}
            >
              {currentSettings.language === 'ko' ? '저장' : 'Save'}
            </Button>
          </View>
        </Modal>
      </Portal>
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
  statusCard: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: Math.min(width * 0.02, 8),
  },
  memosCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Math.min(height * 0.02, 16),
    fontSize: Math.min(width * 0.04, 16),
  },
  memoItem: {
    borderBottomWidth: 1,
    minHeight: Math.min(height * 0.06, 60),
    paddingVertical: Math.min(height * 0.005, 4),
  },
  memoTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  memoDescription: {
    fontSize: Math.min(width * 0.035, 14),
    marginTop: 2,
  },
  memoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: Math.min(width * 0.02, 8),
  },
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: Math.min(height * 0.1, 80),
  },
  voiceModal: {
    padding: Math.min(width * 0.05, 20),
    margin: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    maxWidth: Math.min(width * 0.9, 400),
    alignItems: 'center',
  },
  modal: {
    padding: Math.min(width * 0.05, 20),
    margin: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    maxWidth: Math.min(width * 0.9, 400),
  },
  modalTitle: {
    marginBottom: Math.min(height * 0.02, 16),
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalInput: {
    marginVertical: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.08, 60),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Math.min(height * 0.02, 16),
    gap: Math.min(width * 0.02, 8),
  },
  modalButton: {
    flex: 1,
    minHeight: Math.min(height * 0.05, 40),
  },
  cancelButton: {
    marginTop: Math.min(height * 0.02, 16),
    minWidth: Math.min(width * 0.3, 120),
  },
}); 