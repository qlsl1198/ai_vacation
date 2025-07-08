import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { oauthService, OAuthUser } from '../services/oauth';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'kakao' | 'guest';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithKakao: () => Promise<void>;
  loginWithTest: (provider: 'google' | 'kakao') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      if (!['google', 'kakao', 'guest'].includes(userData.provider)) {
        throw new Error('지원하지 않는 로그인 방식입니다.');
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user to storage:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const oauthUser = await oauthService.signInWithGoogle();
      
      if (oauthUser) {
        const userData: User = {
          id: oauthUser.id,
          email: oauthUser.email,
          name: oauthUser.name,
          avatar: oauthUser.avatar,
          provider: 'google',
        };
        
        await login(userData);
      } else {
        throw new Error('Google 로그인이 취소되었습니다.');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithKakao = async () => {
    try {
      setIsLoading(true);
      const oauthUser = await oauthService.signInWithKakao();
      
      if (oauthUser) {
        const userData: User = {
          id: oauthUser.id,
          email: oauthUser.email,
          name: oauthUser.name,
          avatar: oauthUser.avatar,
          provider: 'kakao',
        };
        
        await login(userData);
      } else {
        throw new Error('Kakao 로그인이 취소되었습니다.');
      }
    } catch (error) {
      console.error('Kakao 로그인 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTest = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(true);
      const oauthUser = await oauthService.signInWithTest(provider);
      
      const userData: User = {
        id: oauthUser.id,
        email: oauthUser.email,
        name: oauthUser.name,
        avatar: oauthUser.avatar,
        provider,
      };
      
      await login(userData);
    } catch (error) {
      console.error('테스트 로그인 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.provider && user.provider !== 'guest') {
        await oauthService.signOut(user.provider);
      }
      
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Failed to remove user from storage:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    loginWithKakao,
    loginWithTest,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 