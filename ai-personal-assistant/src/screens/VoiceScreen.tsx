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

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

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

  const handleVoiceResult = (text: string) => {
    if (text.trim()) {
      const newMemo: VoiceMemo = {
        id: Date.now().toString(),
        text: text,
        timestamp: new Date(),
        category: 'memo',
      };
      setVoiceMemos(prev => [newMemo, ...prev]);
      setShowVoiceRecorder(false);
      Alert.alert('녹음 완료', '음성 메모가 저장되었습니다.');
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
      await Speech.speak(text, {
        language: 'ko-KR',
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
      '메모 삭제',
      '이 메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => setVoiceMemos(prev => prev.filter(memo => memo.id !== id)),
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reminder': return '#FF6B6B';
      case 'memo': return '#4ECDC4';
      case 'note': return '#45B7D1';
      default: return '#95A5A6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reminder': return 'alarm';
      case 'memo': return 'file-document';
      case 'note': return 'create';
      default: return 'document';
    }
  };

  if (showVoiceRecorder) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Button
          mode="text"
          onPress={() => setShowVoiceRecorder(false)}
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={styles.backButtonText}
        >
          뒤로 가기
        </Button>
        <VoiceRecorder onResult={handleVoiceResult} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* 음성 인식 카드 */}
        <Card style={[styles.recordingCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>음성 인식</Title>
            <Paragraph style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
              {isApiKeySet 
                ? '마이크 버튼을 눌러 음성 메모를 녹음하거나 음성으로 명령을 내리세요.'
                : '음성 인식 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.'
              }
            </Paragraph>
            <View style={styles.recordingControls}>
              <Button
                mode="contained"
                onPress={startRecording}
                style={[
                  styles.recordButton,
                  { backgroundColor: isApiKeySet ? theme.colors.primary : theme.colors.onSurfaceVariant }
                ]}
                icon="microphone"
                disabled={!isApiKeySet}
              >
                음성 인식 시작
              </Button>
              {!isApiKeySet && (
                <Paragraph style={[styles.apiKeyNotice, { color: theme.colors.error }]}>
                  API 키가 설정되지 않았습니다
                </Paragraph>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 음성 메모 목록 */}
        <Card style={[styles.memosCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>음성 메모</Title>
            {voiceMemos.length === 0 ? (
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                아직 음성 메모가 없습니다. 녹음 버튼을 눌러 첫 메모를 만들어보세요!
              </Paragraph>
            ) : (
              voiceMemos.map((memo) => (
                <List.Item
                  key={memo.id}
                  title={memo.text}
                  description={memo.timestamp.toLocaleString('ko-KR')}
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
                      <Chip
                        mode="outlined"
                        style={[
                          styles.categoryChip,
                          { borderColor: getCategoryColor(memo.category) }
                        ]}
                        textStyle={{ color: getCategoryColor(memo.category) }}
                      >
                        {memo.category === 'reminder' ? '알림' :
                         memo.category === 'memo' ? '메모' : '노트'}
                      </Chip>
                    </View>
                  )}
                  onPress={() => showModal(memo)}
                  style={[styles.memoItem, { borderBottomColor: theme.colors.outline }]}
                />
              ))
            )}
          </Card.Content>
        </Card>

        {/* 음성 합성 테스트 */}
        <Card style={[styles.ttsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>음성 합성 테스트</Title>
            <Paragraph style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
              텍스트를 입력하고 음성으로 들을 수 있습니다.
            </Paragraph>
            <TextInput
              label="음성으로 들을 텍스트"
              value={inputText}
              onChangeText={setInputText}
              style={[styles.ttsInput, { backgroundColor: theme.colors.surfaceVariant }]}
              multiline
              mode="outlined"
              dense
            />
            <Button
              mode="contained"
              onPress={() => speakText(inputText)}
              disabled={!inputText.trim()}
              style={[styles.ttsButton, { backgroundColor: theme.colors.primary }]}
              icon={isSpeaking ? 'stop' : 'volume-high'}
            >
              {isSpeaking ? '음성 중지' : '음성 재생'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for adding new memo */}
      <Portal>
        <FAB
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: Math.min(height * 0.1, 80) + 24, width: 56, height: 56 }
          ]}
          icon="plus"
          onPress={() => showModal()}
          size="medium"
        />
      </Portal>

      {/* Edit/Add Memo Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {selectedMemo ? '메모 수정' : '새 메모 추가'}
          </Title>
          <TextInput
            label="메모 내용"
            value={inputText}
            onChangeText={setInputText}
            multiline
            style={[styles.modalInput, { backgroundColor: theme.colors.surfaceVariant }]}
            mode="outlined"
            dense
          />
          <View style={styles.modalButtons}>
            {selectedMemo && (
              <Button
                mode="outlined"
                onPress={() => deleteMemo(selectedMemo.id)}
                style={styles.modalButton}
                textColor={theme.colors.error}
              >
                삭제
              </Button>
            )}
            <Button onPress={hideModal} style={styles.modalButton}>
              취소
            </Button>
            <Button
              mode="contained"
              onPress={saveMemo}
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              disabled={!inputText.trim()}
            >
              저장
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
    padding: Math.min(width * 0.04, 16),
  },
  backButton: {
    margin: Math.min(width * 0.04, 16),
    minHeight: Math.min(height * 0.05, 40),
  },
  backButtonText: {
    fontSize: Math.min(width * 0.04, 16),
  },
  recordingCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
    marginBottom: Math.min(height * 0.01, 8),
  },
  cardDescription: {
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: Math.min(width * 0.06, 24),
  },
  recordingControls: {
    alignItems: 'center',
    marginTop: Math.min(height * 0.02, 16),
  },
  recordButton: {
    minWidth: Math.min(width * 0.4, 160),
    minHeight: Math.min(height * 0.06, 48),
    borderRadius: Math.min(width * 0.02, 8),
  },
  apiKeyNotice: {
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.035, 14),
    textAlign: 'center',
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
  categoryChip: {
    marginLeft: Math.min(width * 0.02, 8),
  },
  ttsCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ttsInput: {
    marginVertical: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.08, 60),
  },
  ttsButton: {
    marginTop: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.05, 40),
  },
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: 0,
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
}); 