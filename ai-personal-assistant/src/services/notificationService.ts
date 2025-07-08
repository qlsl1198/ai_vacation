import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { settingsService } from './settings';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 권한 요청
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('알림 권한이 필요합니다.');
      }

      // Android 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '기본 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('알림 서비스 초기화 실패:', error);
      throw error;
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      // 알림 설정 확인
      const notificationsEnabled = await settingsService.getSetting('notifications');
      if (!notificationsEnabled) {
        throw new Error('알림이 비활성화되어 있습니다.');
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('알림 예약 실패:', error);
      throw error;
    }
  }

  async sendImmediateNotification(title: string, body: string): Promise<string> {
    return this.scheduleNotification(title, body);
  }

  async scheduleReminderNotification(
    title: string,
    body: string,
    date: Date
  ): Promise<string> {
    return this.scheduleNotification(title, body, {
      date,
    } as any);
  }

  async scheduleRepeatingNotification(
    title: string,
    body: string,
    interval: number // 초 단위
  ): Promise<string> {
    return this.scheduleNotification(title, body, {
      seconds: interval,
      repeats: true,
    } as any);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('알림 취소 실패:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('모든 알림 취소 실패:', error);
      throw error;
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('예약된 알림 조회 실패:', error);
      return [];
    }
  }

  async getNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('알림 권한 조회 실패:', error);
      throw error;
    }
  }

  // AI 응답 완료 알림
  async notifyAIResponseReady(): Promise<void> {
    try {
      await this.sendImmediateNotification(
        'AI 응답 완료',
        'AI가 질문에 답변을 완료했습니다.'
      );
    } catch (error) {
      console.error('AI 응답 알림 실패:', error);
    }
  }

  // 음성 인식 완료 알림
  async notifyVoiceRecognitionComplete(): Promise<void> {
    try {
      await this.sendImmediateNotification(
        '음성 인식 완료',
        '음성이 텍스트로 변환되었습니다.'
      );
    } catch (error) {
      console.error('음성 인식 알림 실패:', error);
    }
  }

  // 이미지 분석 완료 알림
  async notifyImageAnalysisComplete(): Promise<void> {
    try {
      await this.sendImmediateNotification(
        '이미지 분석 완료',
        '이미지 분석이 완료되었습니다.'
      );
    } catch (error) {
      console.error('이미지 분석 알림 실패:', error);
    }
  }

  // 일일 리마인더 알림
  async scheduleDailyReminder(): Promise<string> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 오전 9시

    return this.scheduleReminderNotification(
      'AI 비서와 대화해보세요!',
      '오늘도 AI 비서와 함께 생산적인 하루를 보내세요.',
      tomorrow
    );
  }
}

export const notificationService = new NotificationService(); 