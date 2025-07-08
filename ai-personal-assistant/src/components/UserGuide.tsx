import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { settingsService } from '../services/settings';

const { width, height } = Dimensions.get('window');

interface UserGuideProps {
  visible: boolean;
  onClose: () => void;
  isFromSettings?: boolean;
}

const UserGuide: React.FC<UserGuideProps> = ({ visible, onClose, isFromSettings = false }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('ko');

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      loadLanguageSettings();
    }
  }, [visible]);

  // 언어 설정 변경 감지
  useEffect(() => {
    const checkLanguageSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.language !== currentLanguage) {
          setCurrentLanguage(settings.language);
        }
      } catch (error) {
        console.error('언어 설정 확인 실패:', error);
      }
    };

    const interval = setInterval(checkLanguageSettings, 1000);
    return () => clearInterval(interval);
  }, [currentLanguage]);

  // 언어 설정 로드
  const loadLanguageSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setCurrentLanguage(settings.language);
    } catch (error) {
      console.error('언어 설정 로드 실패:', error);
    }
  };

  // 언어별 가이드 스텝
  const getGuideSteps = (language: string) => {
    if (language === 'ko') {
      return [
        {
          title: 'AI 개인 비서에 오신 것을 환영합니다! 👋',
          description: '이 앱은 AI를 활용하여 당신의 일상을 더욱 스마트하게 만들어드립니다.',
          icon: 'smart-toy',
          color: '#4CAF50',
        },
        {
          title: '음성으로 대화하기 🎤',
          description: '음성 버튼을 눌러 AI와 자연스럽게 대화하세요. 질문, 요청, 대화 등 무엇이든 가능합니다.',
          icon: 'mic',
          color: '#2196F3',
        },
        {
          title: '카메라로 분석하기 📷',
          description: '사진을 찍거나 갤러리에서 이미지를 선택하여 AI가 분석해드립니다. 물체 인식, 텍스트 추출 등 다양한 기능을 제공합니다.',
          icon: 'camera-alt',
          color: '#FF9800',
        },
        {
          title: '채팅으로 소통하기 💬',
          description: '텍스트로 AI와 대화하세요. 복잡한 질문이나 긴 대화에도 최적화되어 있습니다.',
          icon: 'chat',
          color: '#9C27B0',
        },
        {
          title: '개인화된 설정 ⚙️',
          description: '설정에서 AI 응답 스타일, 언어, 테마 등을 커스터마이징할 수 있습니다.',
          icon: 'settings',
          color: '#607D8B',
        },
        {
          title: '모든 준비가 완료되었습니다! 🎉',
          description: '이제 AI 개인 비서와 함께 더욱 스마트한 일상을 시작해보세요.',
          icon: 'check-circle',
          color: '#4CAF50',
        },
      ];
    } else {
      return [
        {
          title: 'Welcome to AI Personal Assistant! 👋',
          description: 'This app uses AI to make your daily life smarter and more efficient.',
          icon: 'smart-toy',
          color: '#4CAF50',
        },
        {
          title: 'Talk with Voice 🎤',
          description: 'Press the voice button to have natural conversations with AI. Ask questions, make requests, or just chat - anything is possible.',
          icon: 'mic',
          color: '#2196F3',
        },
        {
          title: 'Analyze with Camera 📷',
          description: 'Take photos or select images from your gallery for AI analysis. Object recognition, text extraction, and various other features are available.',
          icon: 'camera-alt',
          color: '#FF9800',
        },
        {
          title: 'Chat and Communicate 💬',
          description: 'Have text conversations with AI. Optimized for complex questions and long conversations.',
          icon: 'chat',
          color: '#9C27B0',
        },
        {
          title: 'Personalized Settings ⚙️',
          description: 'Customize AI response style, language, theme, and more in the settings.',
          icon: 'settings',
          color: '#607D8B',
        },
        {
          title: 'Everything is Ready! 🎉',
          description: 'Now start your smarter daily life with AI Personal Assistant.',
          icon: 'check-circle',
          color: '#4CAF50',
        },
      ];
    }
  };

  const guideSteps = getGuideSteps(currentLanguage);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipGuide = () => {
    onClose();
  };

  if (!visible) return null;

  const currentGuideStep = guideSteps[currentStep];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.onBackground === '#000000' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isFromSettings 
            ? (currentLanguage === 'ko' ? '사용 가이드' : 'User Guide')
            : (currentLanguage === 'ko' ? '앱 사용법' : 'App Tutorial')
          }
        </Text>
        {!isFromSettings && (
          <TouchableOpacity onPress={skipGuide} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>
              {currentLanguage === 'ko' ? '건너뛰기' : 'Skip'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.stepContainer}>
          <View style={[styles.iconContainer, { backgroundColor: currentGuideStep.color + '20' }]}>
            <MaterialIcons 
              name={currentGuideStep.icon as any} 
              size={Math.min(width * 0.15, 80)} 
              color={currentGuideStep.color} 
            />
          </View>
          
          <Text style={[styles.stepTitle, { color: theme.colors.onBackground }]}>
            {currentGuideStep.title}
          </Text>
          
          <Text style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}>
            {currentGuideStep.description}
          </Text>

          {currentStep === 1 && (
            <View style={styles.tipContainer}>
              <MaterialIcons name="lightbulb" size={20} color="#FFD700" />
              <Text style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                {currentLanguage === 'ko' 
                  ? '팁: "오늘 날씨 어때?" 또는 "음악을 틀어줘" 같은 자연스러운 표현을 사용해보세요'
                  : 'Tip: Try using natural expressions like "How\'s the weather today?" or "Play some music"'
                }
              </Text>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.tipContainer}>
              <MaterialIcons name="lightbulb" size={20} color="#FFD700" />
              <Text style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                {currentLanguage === 'ko' 
                  ? '팁: 문서, 명함, 제품 등을 촬영하면 AI가 내용을 분석하고 요약해드립니다'
                  : 'Tip: Take photos of documents, business cards, or products and AI will analyze and summarize the content'
                }
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {guideSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentStep 
                    ? theme.colors.primary 
                    : theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={prevStep} style={styles.navButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={nextStep} 
            style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === guideSteps.length - 1 
                ? (currentLanguage === 'ko' ? '시작하기' : 'Get Started')
                : (currentLanguage === 'ko' ? '다음' : 'Next')
              }
            </Text>
            <MaterialIcons 
              name={currentStep === guideSteps.length - 1 ? 'check' : 'arrow-forward'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    minHeight: 60,
  },
  headerTitle: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: 'bold',
    flex: 1,
  },
  skipButton: {
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepContainer: {
    width: width - 40,
    alignItems: 'center',
    paddingVertical: 20,
    maxWidth: 400,
  },
  iconContainer: {
    width: Math.min(width * 0.25, 120),
    height: Math.min(width * 0.25, 120),
    borderRadius: Math.min(width * 0.125, 60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.min(height * 0.03, 30),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepTitle: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Math.min(height * 0.02, 20),
    lineHeight: Math.min(width * 0.08, 32),
    paddingHorizontal: 10,
  },
  stepDescription: {
    fontSize: Math.min(width * 0.04, 16),
    textAlign: 'center',
    lineHeight: Math.min(width * 0.06, 24),
    marginBottom: Math.min(height * 0.02, 20),
    paddingHorizontal: 10,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipText: {
    fontSize: Math.min(width * 0.035, 14),
    marginLeft: 10,
    flex: 1,
    lineHeight: Math.min(width * 0.05, 20),
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    alignItems: 'center',
  },
  paginationDot: {
    width: Math.min(width * 0.02, 8),
    height: Math.min(width * 0.02, 8),
    borderRadius: Math.min(width * 0.01, 4),
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },
  navButton: {
    padding: 15,
    minHeight: 50,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.min(width * 0.08, 30),
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
    minHeight: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default UserGuide; 