import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  IS_FIRST_LOGIN: 'is_first_login',
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'theme_mode',
  API_KEY: 'api_key',
} as const;

// User preferences interface
export interface UserPreferences {
  aiResponseStyle: 'friendly' | 'professional' | 'casual';
  language: 'ko' | 'en';
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
}

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  aiResponseStyle: 'friendly',
  language: 'ko',
  voiceEnabled: true,
  notificationsEnabled: true,
};

// Storage utility functions
export const storage = {
  // Set item
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  // Get item
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  },

  // Remove item
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },

  // Clear all data
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },
};

// User-specific storage functions
export const userStorage = {
  // Check if this is the first login
  async isFirstLogin(): Promise<boolean> {
    const isFirst = await storage.getItem<boolean>(STORAGE_KEYS.IS_FIRST_LOGIN);
    return isFirst === null; // null means first time
  },

  // Mark as not first login
  async markAsNotFirstLogin(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.IS_FIRST_LOGIN, false);
  },

  // Get user preferences
  async getUserPreferences(): Promise<UserPreferences> {
    const preferences = await storage.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return preferences || DEFAULT_PREFERENCES;
  },

  // Save user preferences
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const currentPreferences = await this.getUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    await storage.setItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
  },

  // Save user token
  async saveUserToken(token: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.USER_TOKEN, token);
  },

  // Get user token
  async getUserToken(): Promise<string | null> {
    return await storage.getItem<string>(STORAGE_KEYS.USER_TOKEN);
  },

  // Save user data
  async saveUserData(userData: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.USER_DATA, userData);
  },

  // Get user data
  async getUserData(): Promise<any> {
    return await storage.getItem(STORAGE_KEYS.USER_DATA);
  },

  // Clear user data (logout)
  async clearUserData(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.USER_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // API Key management
  async saveApiKey(apiKey: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  },

  async getApiKey(): Promise<string | null> {
    return await storage.getItem<string>(STORAGE_KEYS.API_KEY);
  },

  async removeApiKey(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.API_KEY);
  },
}; 