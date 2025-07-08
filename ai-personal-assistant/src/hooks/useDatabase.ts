import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { ChatMessage, UserSettings, NotificationItem, ChatSession } from '../types/database';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터베이스 초기화
  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await databaseService.initDatabase();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터베이스 초기화 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // 채팅 세션 관련 훅
  const useChatSessions = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);

    const loadSessions = useCallback(async () => {
      if (!isInitialized) return;
      try {
        setLoading(true);
        const data = await databaseService.getChatSessions();
        setSessions(data);
      } catch (err) {
        console.error('채팅 세션 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }, [isInitialized]);

    const createSession = useCallback(async (sessionId: string, title: string) => {
      if (!isInitialized) return;
      try {
        await databaseService.createChatSession(sessionId, title);
        await loadSessions();
      } catch (err) {
        console.error('채팅 세션 생성 실패:', err);
      }
    }, [isInitialized, loadSessions]);

    const deleteSession = useCallback(async (sessionId: string) => {
      if (!isInitialized) return;
      try {
        await databaseService.deleteChatSession(sessionId);
        await loadSessions();
      } catch (err) {
        console.error('채팅 세션 삭제 실패:', err);
      }
    }, [isInitialized, loadSessions]);

    useEffect(() => {
      loadSessions();
    }, [loadSessions]);

    return { sessions, loading, loadSessions, createSession, deleteSession };
  };

  // 채팅 메시지 관련 훅
  const useChatMessages = (sessionId: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const loadMessages = useCallback(async () => {
      if (!isInitialized || !sessionId) return;
      try {
        setLoading(true);
        const data = await databaseService.getChatMessages(sessionId);
        setMessages(data);
      } catch (err) {
        console.error('채팅 메시지 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }, [isInitialized, sessionId]);

    const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id'>) => {
      if (!isInitialized) return;
      try {
        await databaseService.saveChatMessage(message);
        await loadMessages();
      } catch (err) {
        console.error('채팅 메시지 저장 실패:', err);
      }
    }, [isInitialized, loadMessages]);

    const clearMessages = useCallback(async () => {
      if (!isInitialized || !sessionId) return;
      try {
        await databaseService.deleteChatMessages(sessionId);
        setMessages([]);
      } catch (err) {
        console.error('채팅 메시지 삭제 실패:', err);
      }
    }, [isInitialized, sessionId]);

    useEffect(() => {
      loadMessages();
    }, [loadMessages]);

    return { messages, loading, loadMessages, saveMessage, clearMessages };
  };

  // 사용자 설정 관련 훅
  const useUserSettings = () => {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSettings = useCallback(async () => {
      if (!isInitialized) return;
      try {
        setLoading(true);
        const data = await databaseService.getUserSettings();
        setSettings(data);
      } catch (err) {
        console.error('사용자 설정 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }, [isInitialized]);

    const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
      if (!isInitialized) return;
      try {
        await databaseService.updateUserSettings(newSettings);
        await loadSettings();
      } catch (err) {
        console.error('사용자 설정 업데이트 실패:', err);
      }
    }, [isInitialized, loadSettings]);

    useEffect(() => {
      loadSettings();
    }, [loadSettings]);

    return { settings, loading, loadSettings, updateSettings };
  };

  // 알림 관련 훅
  const useNotifications = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadNotifications = useCallback(async () => {
      if (!isInitialized) return;
      try {
        setLoading(true);
        const [data, count] = await Promise.all([
          databaseService.getNotifications(),
          databaseService.getUnreadNotificationCount()
        ]);
        setNotifications(data);
        setUnreadCount(count);
      } catch (err) {
        console.error('알림 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }, [isInitialized]);

    const saveNotification = useCallback(async (notification: Omit<NotificationItem, 'id'>) => {
      if (!isInitialized) return;
      try {
        await databaseService.saveNotification(notification);
        await loadNotifications();
      } catch (err) {
        console.error('알림 저장 실패:', err);
      }
    }, [isInitialized, loadNotifications]);

    const markAsRead = useCallback(async (id: number) => {
      if (!isInitialized) return;
      try {
        await databaseService.markNotificationAsRead(id);
        await loadNotifications();
      } catch (err) {
        console.error('알림 읽음 표시 실패:', err);
      }
    }, [isInitialized, loadNotifications]);

    const deleteNotification = useCallback(async (id: number) => {
      if (!isInitialized) return;
      try {
        await databaseService.deleteNotification(id);
        await loadNotifications();
      } catch (err) {
        console.error('알림 삭제 실패:', err);
      }
    }, [isInitialized, loadNotifications]);

    useEffect(() => {
      loadNotifications();
    }, [loadNotifications]);

    return {
      notifications,
      unreadCount,
      loading,
      loadNotifications,
      saveNotification,
      markAsRead,
      deleteNotification
    };
  };

  return {
    isInitialized,
    isLoading,
    error,
    initializeDatabase,
    useChatSessions,
    useChatMessages,
    useUserSettings,
    useNotifications
  };
}; 