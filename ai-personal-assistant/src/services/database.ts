import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, UserSettings, NotificationItem, ChatSession } from '../types/database';

class DatabaseService {
  private isWeb = Platform.OS === 'web';

  async initDatabase(): Promise<void> {
    try {
      console.log('데이터베이스 초기화 완료 (AsyncStorage 사용)');
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
    }
  }

  // AsyncStorage 메서드들
  private async getWebData<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('AsyncStorage 읽기 오류:', error);
      return null;
    }
  }

  private async setWebData<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('AsyncStorage 쓰기 오류:', error);
    }
  }

  private async removeWebData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage 삭제 오류:', error);
    }
  }

  // 채팅 세션 관련 메서드
  async createChatSession(sessionId: string, title: string): Promise<void> {
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    const newSession: ChatSession = {
      sessionId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0
    };
    sessions.unshift(newSession);
    await this.setWebData('chat_sessions', sessions);
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return await this.getWebData<ChatSession[]>('chat_sessions') || [];
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    return sessions.find(s => s.sessionId === sessionId) || null;
  }

  async updateChatSession(sessionId: string, title?: string): Promise<void> {
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].updatedAt = Date.now();
      if (title) sessions[sessionIndex].title = title;
      await this.setWebData('chat_sessions', sessions);
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    await this.setWebData('chat_sessions', filteredSessions);
    
    // 관련 메시지도 삭제
    const messages = await this.getWebData<ChatMessage[]>('chat_messages') || [];
    const filteredMessages = messages.filter(m => m.sessionId !== sessionId);
    await this.setWebData('chat_messages', filteredMessages);
  }

  // 채팅 메시지 관련 메서드
  async saveChatMessage(message: ChatMessage): Promise<void> {
    const messages = await this.getWebData<ChatMessage[]>('chat_messages') || [];
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now() // 임시 ID 생성
    };
    messages.push(newMessage);
    await this.setWebData('chat_messages', messages);

    // 세션 업데이트
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    const sessionIndex = sessions.findIndex(s => s.sessionId === message.sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].messageCount += 1;
      sessions[sessionIndex].updatedAt = Date.now();
      await this.setWebData('chat_sessions', sessions);
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.getWebData<ChatMessage[]>('chat_messages') || [];
    return messages.filter(m => m.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
  }

  async deleteChatMessages(sessionId: string): Promise<void> {
    const messages = await this.getWebData<ChatMessage[]>('chat_messages') || [];
    const filteredMessages = messages.filter(m => m.sessionId !== sessionId);
    await this.setWebData('chat_messages', filteredMessages);

    // 세션 메시지 수 초기화
    const sessions = await this.getWebData<ChatSession[]>('chat_sessions') || [];
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].messageCount = 0;
      sessions[sessionIndex].updatedAt = Date.now();
      await this.setWebData('chat_sessions', sessions);
    }
  }

  // 사용자 설정 관련 메서드
  async getUserSettings(): Promise<UserSettings | null> {
    const settings = await this.getWebData<UserSettings>('user_settings');
    if (!settings) {
      // 기본 설정 생성
      const defaultSettings: UserSettings = {
        notificationsEnabled: true,
        voiceEnabled: true,
        theme: 'auto',
        language: 'ko'
      };
      await this.setWebData('user_settings', defaultSettings);
      return defaultSettings;
    }
    return settings;
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getUserSettings();
    if (currentSettings) {
      const updatedSettings = { ...currentSettings, ...settings };
      await this.setWebData('user_settings', updatedSettings);
    }
  }

  // 알림 관련 메서드
  async saveNotification(notification: Omit<NotificationItem, 'id'>): Promise<void> {
    const notifications = await this.getWebData<NotificationItem[]>('notifications') || [];
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now() // 임시 ID 생성
    };
    notifications.unshift(newNotification);
    await this.setWebData('notifications', notifications);
  }

  async getNotifications(): Promise<NotificationItem[]> {
    return await this.getWebData<NotificationItem[]>('notifications') || [];
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notifications = await this.getWebData<NotificationItem[]>('notifications') || [];
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex !== -1) {
      notifications[notificationIndex].isRead = true;
      await this.setWebData('notifications', notifications);
    }
  }

  async deleteNotification(id: number): Promise<void> {
    const notifications = await this.getWebData<NotificationItem[]>('notifications') || [];
    const filteredNotifications = notifications.filter(n => n.id !== id);
    await this.setWebData('notifications', filteredNotifications);
  }

  async getUnreadNotificationCount(): Promise<number> {
    const notifications = await this.getWebData<NotificationItem[]>('notifications') || [];
    return notifications.filter(n => !n.isRead).length;
  }

  // 데이터베이스 정리
  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      'chat_sessions',
      'chat_messages',
      'notifications'
    ]);
    // 기본 설정은 유지
  }

  async closeDatabase(): Promise<void> {
    // AsyncStorage는 별도로 닫을 필요 없음
  }
}

// 싱글톤 인스턴스 생성
export const databaseService = new DatabaseService(); 