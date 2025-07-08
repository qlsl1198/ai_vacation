import React, { createContext, useContext, ReactNode } from 'react';
import { useDatabase } from '../hooks/useDatabase';

interface DatabaseContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeDatabase: () => Promise<void>;
  useChatSessions: () => {
    sessions: any[];
    loading: boolean;
    loadSessions: () => Promise<void>;
    createSession: (sessionId: string, title: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
  };
  useChatMessages: (sessionId: string) => {
    messages: any[];
    loading: boolean;
    loadMessages: () => Promise<void>;
    saveMessage: (message: any) => Promise<void>;
    clearMessages: () => Promise<void>;
  };
  useUserSettings: () => {
    settings: any;
    loading: boolean;
    loadSettings: () => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
  };
  useNotifications: () => {
    notifications: any[];
    unreadCount: number;
    loading: boolean;
    loadNotifications: () => Promise<void>;
    saveNotification: (notification: any) => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
  };
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const database = useDatabase();

  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseContext는 DatabaseProvider 내에서 사용되어야 합니다.');
  }
  return context;
}; 