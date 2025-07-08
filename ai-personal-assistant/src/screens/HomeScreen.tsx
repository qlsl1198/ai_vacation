import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  List,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../components/VoiceRecorder';
import ImageAnalyzer from '../components/ImageAnalyzer';
import UserGuide from '../components/UserGuide';
import { userStorage } from '../services/storage';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

// 웹에서는 LinearGradient를 사용하지 않음
let LinearGradient: any = null;
if (Platform.OS !== 'web') {
  const { LinearGradient: ExpoLinearGradient } = require('expo-linear-gradient');
  LinearGradient = ExpoLinearGradient;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
}

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '회의 준비',
      description: '오후 2시 팀 미팅 자료 준비',
      completed: false,
      priority: 'high',
      dueDate: new Date(Date.now() + 3600000),
    },
    {
      id: '2',
      title: '운동하기',
      description: '30분 조깅',
      completed: true,
      priority: 'medium',
      dueDate: new Date(Date.now() + 7200000),
    },
  ]);

  const [visible, setVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showUserGuide, setShowUserGuide] = useState(false);

  useEffect(() => {
    checkFirstLogin();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkFirstLogin = async () => {
    try {
      const isFirst = await userStorage.isFirstLogin();
      if (isFirst) {
        setShowUserGuide(true);
      }
    } catch (error) {
      console.error('Error checking first login:', error);
    }
  };

  const handleUserGuideClose = async () => {
    setShowUserGuide(false);
    try {
      await userStorage.markAsNotFirstLogin();
    } catch (error) {
      console.error('Error marking as not first login:', error);
    }
  };

  const showModal = () => {
    setVisible(true);
  };
  
  const hideModal = () => setVisible(false);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        description: newTaskDescription,
        completed: false,
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000), // 24시간 후
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      hideModal();
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#66BB6A';
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleFeaturePress = (feature: string) => {
    setSelectedFeature(feature);
  };

  const handleBackPress = () => {
    setSelectedFeature(null);
  };

  const renderFeatureScreen = () => {
    switch (selectedFeature) {
      case 'voice':
        return (
          <View style={[styles.featureContainer, { backgroundColor: theme.colors.background }]}>
            <Button
              mode="text"
              onPress={handleBackPress}
              icon="arrow-left"
              style={styles.backButton}
              labelStyle={styles.backButtonText}
            >
              뒤로 가기
            </Button>
            <VoiceRecorder
              onResult={(text) => {
                setNewTaskTitle(text);
                setSelectedFeature(null);
                setVisible(true);
              }}
            />
          </View>
        );
      case 'image':
        return (
          <View style={[styles.featureContainer, { backgroundColor: theme.colors.background }]}>
            <Button
              mode="text"
              onPress={handleBackPress}
              icon="arrow-left"
              style={styles.backButton}
              labelStyle={styles.backButtonText}
            >
              뒤로 가기
            </Button>
            <ImageAnalyzer />
          </View>
        );
      default:
        return (
          <>
            {LinearGradient ? (
              <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.gradient}
              >
                {renderMainContent()}
              </LinearGradient>
            ) : (
              <View style={[styles.gradient, { backgroundColor: theme.colors.background }]}>
                {renderMainContent()}
              </View>
            )}
          </>
        );
    }
  };

  const renderMainContent = () => (
    <>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }}>
          {/* AI 비서 환영 메시지 */}
          <Card style={[styles.welcomeCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Title style={[styles.welcomeTitle, { color: theme.colors.onSurface }]}>안녕하세요! 👋</Title>
              <Paragraph style={[styles.welcomeParagraph, { color: theme.colors.onSurfaceVariant }]}>
                오늘도 AI 비서가 도와드릴게요. 무엇을 도와드릴까요?
              </Paragraph>
            </Card.Content>
          </Card>

          {/* 오늘의 통계 */}
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Title style={[styles.statsTitle, { color: theme.colors.onSurface }]}>오늘의 진행상황</Title>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: progress >= 75 ? '#4CAF50' : theme.colors.primary,
                    }
                  ]}
                />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Title style={[styles.statNumber, { color: theme.colors.onSurface }]}>{completedTasks}</Title>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>완료된 작업</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={[styles.statNumber, { color: theme.colors.onSurface }]}>{totalTasks - completedTasks}</Title>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>남은 작업</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={[styles.statNumber, { color: theme.colors.onSurface }]}>{Math.round(progress)}%</Title>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>진행률</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 빠른 액션 */}
          <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Title style={[styles.actionTitle, { color: theme.colors.onSurface }]}>빠른 액션</Title>
              <View style={styles.quickActions}>
                <Button
                  mode="contained"
                  onPress={() => handleFeaturePress('voice')}
                  style={[styles.quickActionButton, { backgroundColor: '#007AFF' }]}
                  icon="microphone"
                  labelStyle={styles.quickActionButtonText}
                >
                  음성 메모
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleFeaturePress('image')}
                  style={[styles.quickActionButton, { backgroundColor: '#5856D6' }]}
                  icon="camera"
                  labelStyle={styles.quickActionButtonText}
                >
                  이미지 분석
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* 작업 목록 */}
          <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Title style={[styles.tasksTitle, { color: theme.colors.onSurface }]}>오늘의 작업</Title>
              {tasks.map((task) => (
                <Animated.View
                  key={task.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    }],
                  }}
                >
                  <List.Item
                    title={task.title}
                    description={task.description}
                    titleStyle={[styles.taskTitle, { color: theme.colors.onSurface }]}
                    descriptionStyle={[styles.taskDescription, { color: theme.colors.onSurfaceVariant }]}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={task.completed ? 'check-circle' : 'circle-outline'}
                        color={task.completed ? '#4CAF50' : theme.colors.onSurface}
                      />
                    )}
                    right={(props) => (
                      <View style={styles.taskRight}>
                        <View
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(task.priority) }
                          ]}
                        />
                        {task.dueDate && (
                          <Paragraph style={[styles.dueDate, { color: theme.colors.onSurfaceVariant }]}>
                            {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Paragraph>
                        )}
                      </View>
                    )}
                    onPress={() => toggleTask(task.id)}
                    style={[
                      styles.taskItem,
                      { backgroundColor: theme.colors.surface },
                      task.completed && styles.completedTask
                    ]}
                  />
                </Animated.View>
              ))}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* FAB for adding new task */}
      <Portal>
        <FAB
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: Math.min(height * 0.1, 80) + 24, width: 56, height: 56 }
          ]}
          icon="plus"
          onPress={showModal}
          size="medium"
        />
      </Portal>

      {/* New Task Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>새 작업 추가</Title>
          <TextInput
            label="제목"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            style={styles.input}
            mode="outlined"
            dense
          />
          <TextInput
            label="설명"
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            dense
          />
          <View style={styles.modalButtons}>
            <Button onPress={hideModal} style={styles.modalButton} labelStyle={styles.modalButtonText}>
              취소
            </Button>
            <Button
              mode="contained"
              onPress={addTask}
              style={styles.modalButton}
              disabled={!newTaskTitle.trim()}
              labelStyle={styles.modalButtonText}
            >
              추가
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );

  // 알림 테스트 함수 추가
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '테스트 알림',
        body: '이것은 푸시/로컬 알림 테스트입니다.',
      },
      trigger: null, // 즉시 발송
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderFeatureScreen()}
      <UserGuide 
        visible={showUserGuide} 
        onClose={handleUserGuideClose}
        isFromSettings={false}
      />
      {/* 알림 테스트용 버튼 (개발용) */}
      <Button mode="contained" onPress={sendTestNotification} style={{margin: 16}}>
        알림 테스트
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Math.min(width * 0.04, 16),
    paddingBottom: Math.min(height * 0.15, 100),
  },
  welcomeCard: {
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
  welcomeTitle: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: 'bold',
  },
  welcomeParagraph: {
    fontSize: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.01, 8),
    lineHeight: Math.min(width * 0.06, 24),
  },
  statsCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.02, 16),
  },
  progressBar: {
    height: Math.min(height * 0.01, 8),
    borderRadius: Math.min(width * 0.01, 4),
    marginBottom: Math.min(height * 0.02, 16),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Math.min(width * 0.01, 4),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Math.min(height * 0.01, 8),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: Math.min(width * 0.035, 14),
    textAlign: 'center',
  },
  quickActionsCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.02, 16),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Math.min(width * 0.02, 8),
  },
  quickActionButton: {
    flex: 1,
    minHeight: Math.min(height * 0.06, 48),
    borderRadius: Math.min(width * 0.02, 8),
  },
  quickActionButtonText: {
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: '600',
  },
  tasksCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tasksTitle: {
    fontSize: Math.min(width * 0.05, 20),
    marginBottom: Math.min(height * 0.02, 16),
  },
  taskItem: {
    borderRadius: Math.min(width * 0.02, 8),
    marginBottom: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.06, 60),
  },
  taskTitle: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: Math.min(width * 0.035, 14),
    marginTop: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: Math.min(width * 0.03, 12),
    height: Math.min(width * 0.03, 12),
    borderRadius: Math.min(width * 0.015, 6),
    marginRight: Math.min(width * 0.02, 8),
  },
  dueDate: {
    fontSize: Math.min(width * 0.03, 12),
  },
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: 0,
  },
  modalContent: {
    padding: Math.min(width * 0.05, 20),
    margin: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    maxWidth: Math.min(width * 0.9, 400),
  },
  modalTitle: {
    marginBottom: Math.min(height * 0.02, 16),
    textAlign: 'center',
    fontSize: Math.min(width * 0.05, 20),
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
  featureContainer: {
    flex: 1,
  },
  backButton: {
    margin: Math.min(width * 0.04, 16),
    minHeight: Math.min(height * 0.05, 40),
  },
  backButtonText: {
    fontSize: Math.min(width * 0.04, 16),
  },
});

export default HomeScreen; 