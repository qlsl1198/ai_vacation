import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

const DatabaseTest: React.FC = () => {
  const { theme } = useTheme();
  const { isInitialized, isLoading, error, useChatSessions, useUserSettings, useNotifications } = useDatabaseContext();
  
  const { sessions, createSession, deleteSession } = useChatSessions();
  const { settings, updateSettings } = useUserSettings();
  const { notifications, saveNotification, markAsRead, deleteNotification } = useNotifications();

  const [testMessage, setTestMessage] = useState('');

  const handleCreateTestSession = async () => {
    try {
      const sessionId = `test-session-${Date.now()}`;
      await createSession(sessionId, `테스트 세션 ${sessions.length + 1}`);
      Alert.alert('성공', '테스트 세션이 생성되었습니다.');
    } catch (error) {
      Alert.alert('오류', '세션 생성에 실패했습니다.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      Alert.alert('성공', '세션이 삭제되었습니다.');
    } catch (error) {
      Alert.alert('오류', '세션 삭제에 실패했습니다.');
    }
  };

  const handleToggleNotifications = async () => {
    try {
      await updateSettings({ notificationsEnabled: !settings?.notificationsEnabled });
      Alert.alert('성공', '알림 설정이 변경되었습니다.');
    } catch (error) {
      Alert.alert('오류', '설정 변경에 실패했습니다.');
    }
  };

  const handleCreateTestNotification = async () => {
    try {
      await saveNotification({
        title: '테스트 알림',
        body: '이것은 테스트 알림입니다.',
        timestamp: Date.now(),
        isRead: false,
        type: 'system'
      });
      Alert.alert('성공', '테스트 알림이 생성되었습니다.');
    } catch (error) {
      Alert.alert('오류', '알림 생성에 실패했습니다.');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      Alert.alert('성공', '알림이 읽음으로 표시되었습니다.');
    } catch (error) {
      Alert.alert('오류', '알림 상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id);
      Alert.alert('성공', '알림이 삭제되었습니다.');
    } catch (error) {
      Alert.alert('오류', '알림 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
          데이터베이스 초기화 중...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          데이터베이스 오류: {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          데이터베이스 상태
        </Text>
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
            초기화됨: {isInitialized ? '예' : '아니오'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          채팅 세션 테스트
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateTestSession}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.buttonText}>새 세션 생성</Text>
        </TouchableOpacity>

        {sessions.map((session) => (
          <View key={session.sessionId} style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionTitle, { color: theme.colors.onSurface }]}>
                {session.title}
              </Text>
              <Text style={[styles.sessionDetails, { color: theme.colors.onSurfaceVariant }]}>
                메시지: {session.messageCount}개
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
              onPress={() => handleDeleteSession(session.sessionId)}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          사용자 설정 테스트
        </Text>
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
            알림: {settings?.notificationsEnabled ? '활성화' : '비활성화'}
          </Text>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleToggleNotifications}
          >
            <Text style={styles.buttonText}>토글</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          알림 테스트
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateTestNotification}
        >
          <Ionicons name="notifications" size={20} color="white" />
          <Text style={styles.buttonText}>테스트 알림 생성</Text>
        </TouchableOpacity>

        {notifications.map((notification) => (
          <View key={notification.id} style={[styles.notificationCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.notificationInfo}>
              <Text style={[styles.notificationTitle, { color: theme.colors.onSurface }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.colors.onSurfaceVariant }]}>
                {notification.body}
              </Text>
              <Text style={[styles.notificationStatus, { color: theme.colors.onSurfaceVariant }]}>
                {notification.isRead ? '읽음' : '안읽음'}
              </Text>
            </View>
            <View style={styles.notificationActions}>
              {!notification.isRead && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => notification.id && handleMarkAsRead(notification.id)}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={() => notification.id && handleDeleteNotification(notification.id)}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  settingText: {
    fontSize: 16,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 4,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationBody: {
    fontSize: 14,
    marginTop: 4,
  },
  notificationStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
  },
});

export default DatabaseTest; 