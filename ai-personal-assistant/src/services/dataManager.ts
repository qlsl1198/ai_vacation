import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export interface AppData {
  settings: any;
  user: any;
  chatHistory: any[];
  voiceRecordings: any[];
  images: any[];
  notifications: any[];
  timestamp: string;
  version: string;
}

class DataManagerService {
  private readonly BACKUP_FILENAME = 'ai-assistant-backup.json';
  private readonly APP_VERSION = '1.0.0';

  async exportData(): Promise<void> {
    try {
      // 모든 데이터 수집
      const data: AppData = {
        settings: await this.getSettingsData(),
        user: await this.getUserData(),
        chatHistory: await this.getChatHistory(),
        voiceRecordings: await this.getVoiceRecordings(),
        images: await this.getImageData(),
        notifications: await this.getNotificationData(),
        timestamp: new Date().toISOString(),
        version: this.APP_VERSION,
      };

      // JSON 파일로 저장
      const jsonData = JSON.stringify(data, null, 2);
      
      // 웹 환경에서는 Blob을 사용하여 다운로드
      if (typeof window !== 'undefined' && window.navigator) {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.BACKUP_FILENAME;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // 모바일 환경에서는 기존 방식 사용
      const fileUri = `${FileSystem.documentDirectory}${this.BACKUP_FILENAME}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 파일 공유
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'AI Assistant 데이터 백업',
        });
      } else {
        throw new Error('파일 공유가 지원되지 않습니다.');
      }
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      throw error;
    }
  }

  async importData(): Promise<void> {
    try {
      // 웹 환경에서는 input file을 사용
      if (typeof window !== 'undefined' && window.document) {
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.style.display = 'none';
          
          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('파일 선택이 취소되었습니다.'));
              return;
            }

            try {
              const text = await file.text();
              const data: AppData = JSON.parse(text);

              // 버전 호환성 확인
              if (!data.version || data.version !== this.APP_VERSION) {
                reject(new Error('지원되지 않는 백업 파일 버전입니다.'));
                return;
              }

              // 데이터 복원
              await this.restoreSettings(data.settings);
              await this.restoreUserData(data.user);
              await this.restoreChatHistory(data.chatHistory);
              await this.restoreVoiceRecordings(data.voiceRecordings);
              await this.restoreImageData(data.images);
              await this.restoreNotificationData(data.notifications);

              resolve();
            } catch (error) {
              reject(error);
            }
          };
          
          document.body.appendChild(input);
          input.click();
          document.body.removeChild(input);
        });
      }

      // 모바일 환경에서는 기존 방식 사용
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error('파일 선택이 취소되었습니다.');
      }

      const fileUri = result.assets[0].uri;
      const jsonData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const data: AppData = JSON.parse(jsonData);

      // 버전 호환성 확인
      if (!data.version || data.version !== this.APP_VERSION) {
        throw new Error('지원되지 않는 백업 파일 버전입니다.');
      }

      // 데이터 복원
      await this.restoreSettings(data.settings);
      await this.restoreUserData(data.user);
      await this.restoreChatHistory(data.chatHistory);
      await this.restoreVoiceRecordings(data.voiceRecordings);
      await this.restoreImageData(data.images);
      await this.restoreNotificationData(data.notifications);

    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      // AsyncStorage의 모든 키 가져오기
      const keys = await AsyncStorage.getAllKeys();
      
      // 앱 관련 키만 필터링
      const appKeys = keys.filter(key => 
        key.startsWith('app_') || 
        key.startsWith('user_') || 
        key.startsWith('chat_') || 
        key.startsWith('voice_') || 
        key.startsWith('image_') || 
        key.startsWith('notification_') ||
        key === 'user' ||
        key === 'api_key'
      );

      // 선택된 키들 삭제
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }

      // 파일 시스템의 앱 데이터 삭제
      await this.clearAppFiles();

    } catch (error) {
      console.error('데이터 삭제 실패:', error);
      throw error;
    }
  }

  private async getSettingsData(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('설정 데이터 가져오기 실패:', error);
      return null;
    }
  }

  private async getUserData(): Promise<any> {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('사용자 데이터 가져오기 실패:', error);
      return null;
    }
  }

  private async getChatHistory(): Promise<any[]> {
    try {
      const chatHistory = await AsyncStorage.getItem('chat_history');
      return chatHistory ? JSON.parse(chatHistory) : [];
    } catch (error) {
      console.error('채팅 기록 가져오기 실패:', error);
      return [];
    }
  }

  private async getVoiceRecordings(): Promise<any[]> {
    try {
      const voiceRecordings = await AsyncStorage.getItem('voice_recordings');
      return voiceRecordings ? JSON.parse(voiceRecordings) : [];
    } catch (error) {
      console.error('음성 녹음 가져오기 실패:', error);
      return [];
    }
  }

  private async getImageData(): Promise<any[]> {
    try {
      const images = await AsyncStorage.getItem('image_data');
      return images ? JSON.parse(images) : [];
    } catch (error) {
      console.error('이미지 데이터 가져오기 실패:', error);
      return [];
    }
  }

  private async getNotificationData(): Promise<any[]> {
    try {
      const notifications = await AsyncStorage.getItem('notification_history');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('알림 데이터 가져오기 실패:', error);
      return [];
    }
  }

  private async restoreSettings(settings: any): Promise<void> {
    if (settings) {
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
    }
  }

  private async restoreUserData(user: any): Promise<void> {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  }

  private async restoreChatHistory(chatHistory: any[]): Promise<void> {
    if (chatHistory && chatHistory.length > 0) {
      await AsyncStorage.setItem('chat_history', JSON.stringify(chatHistory));
    }
  }

  private async restoreVoiceRecordings(voiceRecordings: any[]): Promise<void> {
    if (voiceRecordings && voiceRecordings.length > 0) {
      await AsyncStorage.setItem('voice_recordings', JSON.stringify(voiceRecordings));
    }
  }

  private async restoreImageData(images: any[]): Promise<void> {
    if (images && images.length > 0) {
      await AsyncStorage.setItem('image_data', JSON.stringify(images));
    }
  }

  private async restoreNotificationData(notifications: any[]): Promise<void> {
    if (notifications && notifications.length > 0) {
      await AsyncStorage.setItem('notification_history', JSON.stringify(notifications));
    }
  }

  private async clearAppFiles(): Promise<void> {
    try {
      const appDir = FileSystem.documentDirectory;
      if (appDir) {
        const files = await FileSystem.readDirectoryAsync(appDir);
        for (const file of files) {
          if (file.endsWith('.json') || file.endsWith('.mp3') || file.endsWith('.jpg') || file.endsWith('.png')) {
            await FileSystem.deleteAsync(`${appDir}${file}`);
          }
        }
      }
    } catch (error) {
      console.error('앱 파일 삭제 실패:', error);
    }
  }
}

export const dataManagerService = new DataManagerService(); 