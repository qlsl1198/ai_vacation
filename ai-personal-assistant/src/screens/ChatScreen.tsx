import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Paragraph,
  Avatar,
  FAB,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! AI 비서입니다. 무엇을 도와드릴까요?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    await apiService.initialize();
    const hasApiKey = apiService.isApiKeySet();
    setIsApiKeySet(hasApiKey);
    
    if (!hasApiKey) {
      // API 키가 설정되지 않은 경우 안내 메시지 추가
      const apiKeyMessage: Message = {
        id: 'api-key-notice',
        text: 'AI 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, apiKeyMessage]);
    }
  };

  // 실제 AI API 호출
  const getAIResponse = async (userMessage: string) => {
    if (!isApiKeySet) {
      Alert.alert(
        'API 키 필요',
        'AI 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.',
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

    setIsTyping(true);
    
    try {
      const systemPrompt = `당신은 도움이 되는 AI 개인 비서입니다. 
사용자와 친근하고 자연스럽게 대화하며, 한국어로 응답합니다.
간결하고 명확한 답변을 제공하고, 필요시 이모지를 적절히 사용합니다.`;

      const response = await apiService.sendTextMessage(userMessage, systemPrompt);
      
      if (response.success) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response.data,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // API 오류 시 오류 메시지 표시
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: `죄송합니다. 오류가 발생했습니다: ${response.error}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // AI 응답 생성
      getAIResponse(inputText);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <Card style={[
        styles.messageCard,
        item.isUser ? [styles.userCard, { backgroundColor: theme.colors.primary }] : [styles.aiCard, { backgroundColor: theme.colors.surface }]
      ]}>
        <Card.Content>
          <View style={styles.messageHeader}>
            {!item.isUser && (
              <Avatar.Icon 
                size={Math.min(width * 0.06, 24)} 
                icon="robot" 
                style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]}
              />
            )}
            <Paragraph style={[
              styles.messageText,
              item.isUser ? [styles.userText, { color: theme.colors.onPrimary }] : [styles.aiText, { color: theme.colors.onSurface }]
            ]}>
              {item.text}
            </Paragraph>
            {item.isUser && (
              <Avatar.Icon 
                size={Math.min(width * 0.06, 24)} 
                icon="account" 
                style={[styles.userAvatar, { backgroundColor: theme.colors.onPrimary }]}
              />
            )}
          </View>
          <Paragraph style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
            {item.timestamp.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />
        
        {isTyping && (
          <View style={styles.typingContainer}>
            <Card style={[styles.typingCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.typingIndicator}>
                  <Avatar.Icon 
                    size={Math.min(width * 0.06, 24)} 
                    icon="robot" 
                    style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]} 
                  />
                  <Paragraph style={[styles.typingText, { color: theme.colors.onSurfaceVariant }]}>
                    AI가 입력 중...
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요..."
            style={[styles.textInput, { backgroundColor: theme.colors.surfaceVariant }]}
            multiline
            maxLength={500}
            mode="outlined"
            dense
          />
          <Button
            mode="contained"
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
            style={styles.sendButton}
            icon="send"
            labelStyle={styles.sendButtonText}
          >
            전송
          </Button>
        </View>
      </KeyboardAvoidingView>
      
      <FAB
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary, bottom: Math.min(height * 0.1, 80) + 24, width: 56, height: 56 }
        ]}
        icon="microphone"
        onPress={() => {
          // 음성 입력 기능 (추후 구현)
          console.log('음성 입력 시작');
        }}
        size="medium"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Math.min(width * 0.04, 16),
  },
  messageContainer: {
    marginVertical: Math.min(height * 0.005, 4),
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: Math.min(width * 0.8, 320),
    borderRadius: Math.min(width * 0.02, 8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userCard: {
    // backgroundColor will be set dynamically
  },
  aiCard: {
    // backgroundColor will be set dynamically
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageText: {
    flex: 1,
    marginHorizontal: Math.min(width * 0.02, 8),
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: Math.min(width * 0.06, 24),
  },
  userText: {
    // color will be set dynamically
  },
  aiText: {
    // color will be set dynamically
  },
  timestamp: {
    fontSize: Math.min(width * 0.03, 12),
    marginTop: Math.min(height * 0.005, 4),
    textAlign: 'right',
  },
  aiAvatar: {
    // backgroundColor will be set dynamically
  },
  userAvatar: {
    // backgroundColor will be set dynamically
  },
  typingContainer: {
    paddingHorizontal: Math.min(width * 0.04, 16),
    paddingBottom: Math.min(height * 0.01, 8),
  },
  typingCard: {
    maxWidth: Math.min(width * 0.8, 320),
    borderRadius: Math.min(width * 0.02, 8),
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: Math.min(width * 0.02, 8),
    fontStyle: 'italic',
    fontSize: Math.min(width * 0.035, 14),
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Math.min(width * 0.04, 16),
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: Math.min(width * 0.02, 8),
  },
  textInput: {
    flex: 1,
    minHeight: Math.min(height * 0.05, 40),
  },
  sendButton: {
    minHeight: Math.min(height * 0.05, 40),
    minWidth: Math.min(width * 0.15, 60),
  },
  sendButtonText: {
    fontSize: Math.min(width * 0.035, 14),
  },
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: Math.min(height * 0.1, 80),
  },
}); 