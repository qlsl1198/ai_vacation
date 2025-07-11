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
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { settingsService } from '../services/settings';
import { notificationService } from '../services/notificationService';
import { databaseService } from '../services/database';
import { ChatMessage, ChatSession } from '../types/database';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [currentSettings, setCurrentSettings] = useState({
    language: 'ko',
    aiModel: 'gpt-3.5-turbo',
    notifications: true,
  });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  // 설정이 변경될 때마다 메시지 업데이트
  useEffect(() => {
    updateWelcomeMessage();
  }, [currentSettings.language]);

  const initializeChat = async () => {
    try {
      await checkApiKeyStatus();
      await loadSettings();
      await createOrLoadSession();
    } catch (error) {
      console.error('채팅 초기화 실패:', error);
    }
  };

  const createOrLoadSession = async () => {
    try {
      // 현재 세션 ID 생성 또는 기존 세션 로드
      const sessionId = `session_${Date.now()}`;
      setCurrentSessionId(sessionId);
      
      // 새로운 세션 생성
      await databaseService.createChatSession(sessionId, '새로운 대화');
      
      // 기존 메시지 로드 (있다면)
      const savedMessages = await databaseService.getChatMessages(sessionId);
      if (savedMessages.length > 0) {
        const convertedMessages: Message[] = savedMessages.map(msg => ({
          id: msg.id?.toString() || Date.now().toString(),
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setCurrentSettings({
        language: settings.language,
        aiModel: settings.aiModel,
        notifications: settings.notifications,
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const updateWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: currentSettings.language === 'ko' 
        ? '안녕하세요! AI 비서입니다. 무엇을 도와드릴까요?' 
        : 'Hello! I\'m your AI assistant. How can I help you?',
      isUser: false,
      timestamp: new Date(),
    };

    // 기존 메시지가 없거나 환영 메시지가 다른 경우에만 업데이트
    setMessages(prev => {
      const existingWelcome = prev.find(msg => msg.id === 'welcome');
      if (!existingWelcome || existingWelcome.text !== welcomeMessage.text) {
        const filteredMessages = prev.filter(msg => msg.id !== 'welcome' && msg.id !== 'api-key-notice');
        return [welcomeMessage, ...filteredMessages];
      }
      return prev;
    });
  };

  const checkApiKeyStatus = async () => {
    await apiService.initialize();
    const hasApiKey = apiService.isApiKeySet();
    setIsApiKeySet(hasApiKey);
    
    if (!hasApiKey) {
      // API 키가 설정되지 않은 경우 안내 메시지 추가
      const apiKeyMessage: Message = {
        id: 'api-key-notice',
        text: currentSettings.language === 'ko' 
          ? 'AI 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.'
          : 'Please enter your OpenAI API key in settings to use AI features.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== 'api-key-notice');
        return [...filteredMessages, apiKeyMessage];
      });
    }
  };

  // 메시지를 데이터베이스에 저장
  const saveMessageToDatabase = async (message: Message) => {
    try {
      const chatMessage: ChatMessage = {
        role: message.isUser ? 'user' : 'assistant',
        content: message.text,
        timestamp: message.timestamp.getTime(),
        sessionId: currentSessionId,
      };
      await databaseService.saveChatMessage(chatMessage);
    } catch (error) {
      console.error('메시지 저장 실패:', error);
    }
  };

  // 이전 대화 컨텍스트를 AI에게 전달
  const getConversationContext = (): { role: 'user' | 'assistant'; content: string }[] => {
    // 환영 메시지와 API 키 안내 메시지를 제외한 실제 대화만 포함
    const conversationMessages = messages.filter(msg => 
      msg.id !== 'welcome' && msg.id !== 'api-key-notice'
    );
    
    return conversationMessages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));
  };

  // 실제 AI API 호출
  const getAIResponse = async (userMessage: string) => {
    if (!isApiKeySet) {
      Alert.alert(
        currentSettings.language === 'ko' ? 'API 키 필요' : 'API Key Required',
        currentSettings.language === 'ko' 
          ? 'AI 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.'
          : 'Please enter your OpenAI API key in settings to use AI features.',
        [
          { text: currentSettings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
          { 
            text: currentSettings.language === 'ko' ? '설정으로 이동' : 'Go to Settings', 
            onPress: () => {
              // 설정 탭으로 이동하는 로직 (추후 구현)
              console.log('설정으로 이동');
            }
          }
        ]
      );
      return;
    }

    setIsTyping(true);
    
    try {
      // 언어에 따른 시스템 프롬프트 설정
      const systemPrompt = currentSettings.language === 'ko' 
        ? `당신은 도움이 되는 AI 개인 비서입니다. 
사용자와 친근하고 자연스럽게 대화하며, 한국어로 응답합니다.
간결하고 명확한 답변을 제공하고, 필요시 이모지를 적절히 사용합니다.
이전 대화 내용을 참고하여 일관성 있는 대화를 유지하세요.`
        : `You are a helpful AI personal assistant. 
Have friendly and natural conversations with users and respond in English.
Provide concise and clear answers, and use emojis appropriately when needed.
Please refer to previous conversation context to maintain consistency.`;

      // 이전 대화 컨텍스트 포함하여 API 호출
      const conversationContext = getConversationContext();
      const response = await apiService.sendTextMessage(userMessage, systemPrompt, currentSettings.aiModel, conversationContext);
      
      if (response.success) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response.data,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // AI 메시지를 데이터베이스에 저장
        await saveMessageToDatabase(aiMessage);
        
        // 알림이 활성화된 경우 AI 응답 완료 알림
        if (currentSettings.notifications) {
          try {
            await notificationService.notifyAIResponseReady();
          } catch (error) {
            console.log('알림 전송 실패:', error);
          }
        }
      } else {
        // API 오류 시 오류 메시지 표시
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: currentSettings.language === 'ko' 
            ? `죄송합니다. 오류가 발생했습니다: ${response.error}`
            : `Sorry, an error occurred: ${response.error}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: currentSettings.language === 'ko'
          ? '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : 'Sorry, a temporary error occurred. Please try again later.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 사용자 메시지를 데이터베이스에 저장
      await saveMessageToDatabase(userMessage);
      
      setInputText('');
      
      // AI 응답 생성
      getAIResponse(inputText);
    }
  };

  // 대화 기록 삭제
  const clearChatHistory = async () => {
    console.log('clearChatHistory 함수 호출됨');
    Alert.alert(
      currentSettings.language === 'ko' ? '대화 기록 삭제' : 'Clear Chat History',
      currentSettings.language === 'ko' 
        ? '현재 대화 기록을 모두 삭제하시겠습니까?' 
        : 'Are you sure you want to clear all chat history?',
      [
        { text: currentSettings.language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
        {
          text: currentSettings.language === 'ko' ? '삭제' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 현재 세션의 메시지 삭제
              await databaseService.deleteChatMessages(currentSessionId);
              
              // 새로운 세션 생성
              const newSessionId = `session_${Date.now()}`;
              setCurrentSessionId(newSessionId);
              await databaseService.createChatSession(newSessionId, '새로운 대화');
              
              // 메시지 초기화 및 환영 메시지만 표시
              setMessages([]);
              
              // 환영 메시지 추가
              const welcomeMessage: Message = {
                id: 'welcome',
                text: currentSettings.language === 'ko' 
                  ? '안녕하세요! AI 비서입니다. 무엇을 도와드릴까요?' 
                  : 'Hello! I\'m your AI assistant. How can I help you?',
                isUser: false,
                timestamp: new Date(),
              };
              setMessages([welcomeMessage]);
              
              // API 키가 설정되지 않은 경우 안내 메시지 추가
              if (!isApiKeySet) {
                const apiKeyMessage: Message = {
                  id: 'api-key-notice',
                  text: currentSettings.language === 'ko' 
                    ? 'AI 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.'
                    : 'Please enter your OpenAI API key in settings to use AI features.',
                  isUser: false,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, apiKeyMessage]);
              }
              
            } catch (error) {
              console.error('대화 기록 삭제 실패:', error);
              Alert.alert(
                currentSettings.language === 'ko' ? '오류' : 'Error',
                currentSettings.language === 'ko' 
                  ? '대화 기록 삭제 중 오류가 발생했습니다.' 
                  : 'An error occurred while clearing chat history.'
              );
            }
          }
        }
      ]
    );
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
            {item.timestamp.toLocaleTimeString(currentSettings.language === 'ko' ? 'ko-KR' : 'en-US', {
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
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            mode="outlined"
            value={inputText}
            onChangeText={setInputText}
            placeholder={currentSettings.language === 'ko' ? '메시지를 입력하세요...' : 'Type a message...'}
            style={styles.textInput}
            multiline
            maxLength={1000}
            disabled={isTyping || !isApiKeySet}
          />
          <Button
            mode="contained"
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping || !isApiKeySet}
            style={styles.sendButton}
            loading={isTyping}
          >
            <Ionicons name="send" size={Math.min(width * 0.04, 16)} color="white" />
          </Button>
        </View>
      </KeyboardAvoidingView>
      
      {isTyping && (
        <View style={[styles.typingIndicator, { backgroundColor: theme.colors.surface }]}>
          <Paragraph style={[styles.typingText, { color: theme.colors.onSurface }]}>
            {currentSettings.language === 'ko' ? 'AI가 응답을 생성하고 있습니다...' : 'AI is generating a response...'}
          </Paragraph>
        </View>
      )}

      {/* FAB - 대화 기록 삭제 버튼 */}
      <FAB
        icon="delete"
        style={[styles.fab, { backgroundColor: theme.colors.error }]}
        onPress={clearChatHistory}
        color="white"
        label={currentSettings.language === 'ko' ? '대화 삭제' : 'Clear Chat'}
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
  messagesContainer: {
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
  typingIndicator: {
    padding: Math.min(width * 0.04, 16),
    paddingBottom: Math.min(height * 0.01, 8),
  },
  typingText: {
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
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: Math.min(height * 0.1, 80),
  },
}); 