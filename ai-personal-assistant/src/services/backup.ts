import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface BackupData {
  user: string | null;
  chat_sessions: string | null;
  chat_messages: string | null;
  user_settings: string | null;
  notifications: string | null;
  backupDate: string;
  version: string;
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  // 모든 데이터 백업
  async createBackup(): Promise<string> {
    try {
      const backupData: BackupData = {
        user: await AsyncStorage.getItem('user'),
        chat_sessions: await AsyncStorage.getItem('chat_sessions'),
        chat_messages: await AsyncStorage.getItem('chat_messages'),
        user_settings: await AsyncStorage.getItem('user_settings'),
        notifications: await AsyncStorage.getItem('notifications'),
        backupDate: new Date().toISOString(),
        version: this.BACKUP_VERSION
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `ai-assistant-backup-${Date.now()}.json`;
      
      if (Platform.OS === 'web') {
        // 웹에서는 다운로드
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return fileName;
      } else {
        // 모바일에서는 파일로 저장
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, backupJson);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
        
        return fileUri;
      }
    } catch (error) {
      console.error('백업 생성 실패:', error);
      throw error;
    }
  }

  // 백업에서 데이터 복원
  async restoreBackup(backupData: BackupData): Promise<void> {
    try {
      // 기존 데이터 백업
      await this.createBackup();
      
      // 새 데이터로 복원
      if (backupData.user) {
        await AsyncStorage.setItem('user', backupData.user);
      }
      if (backupData.chat_sessions) {
        await AsyncStorage.setItem('chat_sessions', backupData.chat_sessions);
      }
      if (backupData.chat_messages) {
        await AsyncStorage.setItem('chat_messages', backupData.chat_messages);
      }
      if (backupData.user_settings) {
        await AsyncStorage.setItem('user_settings', backupData.user_settings);
      }
      if (backupData.notifications) {
        await AsyncStorage.setItem('notifications', backupData.notifications);
      }
      
      console.log('데이터 복원 완료');
    } catch (error) {
      console.error('데이터 복원 실패:', error);
      throw error;
    }
  }

  // 데이터 내보내기 (CSV 형식)
  async exportChatHistory(): Promise<string> {
    try {
      const messages = await AsyncStorage.getItem('chat_messages');
      const sessions = await AsyncStorage.getItem('chat_sessions');
      
      if (!messages || !sessions) {
        throw new Error('내보낼 데이터가 없습니다.');
      }

      const messagesData = JSON.parse(messages);
      const sessionsData = JSON.parse(sessions);
      
      let csvContent = 'Session,Timestamp,Role,Content\n';
      
      messagesData.forEach((message: any) => {
        const session = sessionsData.find((s: any) => s.sessionId === message.sessionId);
        const sessionTitle = session ? session.title : 'Unknown';
        const timestamp = new Date(message.timestamp).toLocaleString();
        
        csvContent += `"${sessionTitle}","${timestamp}","${message.role}","${message.content.replace(/"/g, '""')}"\n`;
      });

      const fileName = `chat-history-${Date.now()}.csv`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return fileName;
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
        
        return fileUri;
      }
    } catch (error) {
      console.error('채팅 내역 내보내기 실패:', error);
      throw error;
    }
  }

  // 데이터 통계
  async getDataStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalNotifications: number;
    lastBackup?: string;
  }> {
    try {
      const sessions = await AsyncStorage.getItem('chat_sessions');
      const messages = await AsyncStorage.getItem('chat_messages');
      const notifications = await AsyncStorage.getItem('notifications');
      
      const sessionsData = sessions ? JSON.parse(sessions) : [];
      const messagesData = messages ? JSON.parse(messages) : [];
      const notificationsData = notifications ? JSON.parse(notifications) : [];
      
      return {
        totalSessions: sessionsData.length,
        totalMessages: messagesData.length,
        totalNotifications: notificationsData.length,
        lastBackup: new Date().toISOString() // 실제로는 백업 파일에서 읽어와야 함
      };
    } catch (error) {
      console.error('데이터 통계 조회 실패:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService(); 