// 데이터베이스 관련 타입 정의
export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sessionId: string;
  imageUrl?: string;
}

export interface UserSettings {
  id?: number;
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  openaiApiKey?: string;
}

export interface NotificationItem {
  id?: number;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  type: 'chat' | 'reminder' | 'system';
}

export interface ChatSession {
  id?: number;
  sessionId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// 데이터베이스 작업 결과 타입
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 데이터베이스 초기화 옵션
export interface DatabaseOptions {
  name?: string;
  version?: number;
  description?: string;
} 