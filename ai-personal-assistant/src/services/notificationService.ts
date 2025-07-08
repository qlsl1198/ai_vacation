import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { settingsService } from './settings';

// 알림 핸들러 설정 (웹 환경에서는 제한적)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 웹 환경에서는 알림 기능 제한
    if (Platform.OS === 'web') {
      console.log('웹 환경에서는 알림 기능이 제한됩니다.');
      this.isInitialized = true;
      return;
    }

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
    // 웹 환경에서는 브라우저 알림 사용
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
        return 'web-notification';
      } else if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
          return 'web-notification';
        }
      }
      throw new Error('웹 환경에서 알림 권한이 필요합니다.');
    }

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
    // 웹 환경에서는 즉시 알림으로 처리
    if (Platform.OS === 'web') {
      return this.sendImmediateNotification(title, body);
    }
    return this.scheduleNotification(title, body, {
      date,
    } as any);
  }

  async scheduleRepeatingNotification(
    title: string,
    body: string,
    interval: number // 초 단위
  ): Promise<string> {
    // 웹 환경에서는 즉시 알림으로 처리
    if (Platform.OS === 'web') {
      return this.sendImmediateNotification(title, body);
    }
    return this.scheduleNotification(title, body, {
      seconds: interval,
      repeats: true,
    } as any);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    // 웹 환경에서는 취소 불가
    if (Platform.OS === 'web') {
      console.log('웹 환경에서는 알림 취소가 지원되지 않습니다.');
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('알림 취소 실패:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    // 웹 환경에서는 취소 불가
    if (Platform.OS === 'web') {
      console.log('웹 환경에서는 알림 취소가 지원되지 않습니다.');
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('모든 알림 취소 실패:', error);
      throw error;
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    // 웹 환경에서는 빈 배열 반환
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('예약된 알림 조회 실패:', error);
      return [];
    }
  }

  async getNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    // 웹 환경에서는 브라우저 알림 권한 확인
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        switch (Notification.permission) {
          case 'granted':
            return Notifications.PermissionStatus.GRANTED;
          case 'denied':
            return Notifications.PermissionStatus.DENIED;
          default:
            return Notifications.PermissionStatus.UNDETERMINED;
        }
      }
      return Notifications.PermissionStatus.DENIED;
    }

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