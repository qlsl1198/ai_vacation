import { databaseService } from '../services/database';
import { ChatMessage, ChatSession, NotificationItem } from '../types/database';

// 데이터베이스 초기화 유틸리티
export const initializeDatabase = async () => {
  try {
    await databaseService.initDatabase();
    console.log('데이터베이스 초기화 성공');
    return true;
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    return false;
  }
};

// 샘플 데이터 생성 유틸리티
export const createSampleData = async () => {
  try {
    // 샘플 채팅 세션 생성
    const sessionId = `sample-session-${Date.now()}`;
    await databaseService.createChatSession(sessionId, '샘플 대화');

    // 샘플 메시지들 추가
    const sampleMessages: Omit<ChatMessage, 'id'>[] = [
      {
        role: 'user',
        content: '안녕하세요! AI 비서입니다.',
        timestamp: Date.now() - 60000,
        sessionId,
      },
      {
        role: 'assistant',
        content: '안녕하세요! 무엇을 도와드릴까요?',
        timestamp: Date.now() - 50000,
        sessionId,
      },
      {
        role: 'user',
        content: '오늘 날씨는 어때요?',
        timestamp: Date.now() - 40000,
        sessionId,
      },
      {
        role: 'assistant',
        content: '죄송하지만 실시간 날씨 정보에 접근할 수 없습니다. 날씨 앱을 확인해보시는 것을 추천드립니다.',
        timestamp: Date.now() - 30000,
        sessionId,
      },
    ];

    for (const message of sampleMessages) {
      await databaseService.saveChatMessage(message);
    }

    // 샘플 알림 생성
    const sampleNotifications: Omit<NotificationItem, 'id'>[] = [
      {
        title: '환영합니다!',
        body: 'AI 개인 비서 앱에 오신 것을 환영합니다.',
        timestamp: Date.now() - 3600000,
        isRead: false,
        type: 'system',
      },
      {
        title: '샘플 알림',
        body: '이것은 샘플 알림입니다. 알림 기능을 테스트해보세요.',
        timestamp: Date.now() - 1800000,
        isRead: true,
        type: 'system',
      },
    ];

    for (const notification of sampleNotifications) {
      await databaseService.saveNotification(notification);
    }

    console.log('샘플 데이터 생성 완료');
    return true;
  } catch (error) {
    console.error('샘플 데이터 생성 실패:', error);
    return false;
  }
};

// 데이터베이스 백업 유틸리티 (향후 구현)
export const backupDatabase = async () => {
  try {
    // TODO: 데이터베이스 백업 로직 구현
    console.log('데이터베이스 백업 기능은 향후 구현 예정입니다.');
    return true;
  } catch (error) {
    console.error('데이터베이스 백업 실패:', error);
    return false;
  }
};

// 데이터베이스 복원 유틸리티 (향후 구현)
export const restoreDatabase = async () => {
  try {
    // TODO: 데이터베이스 복원 로직 구현
    console.log('데이터베이스 복원 기능은 향후 구현 예정입니다.');
    return true;
  } catch (error) {
    console.error('데이터베이스 복원 실패:', error);
    return false;
  }
};

// 데이터베이스 정리 유틸리티
export const cleanupDatabase = async () => {
  try {
    await databaseService.clearAllData();
    console.log('데이터베이스 정리 완료');
    return true;
  } catch (error) {
    console.error('데이터베이스 정리 실패:', error);
    return false;
  }
};

// 데이터베이스 상태 확인 유틸리티
export const checkDatabaseHealth = async () => {
  try {
    const sessions = await databaseService.getChatSessions();
    const settings = await databaseService.getUserSettings();
    const notifications = await databaseService.getNotifications();
    
    return {
      isHealthy: true,
      sessionsCount: sessions.length,
      hasSettings: !!settings,
      notificationsCount: notifications.length,
    };
  } catch (error) {
    console.error('데이터베이스 상태 확인 실패:', error);
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}; 