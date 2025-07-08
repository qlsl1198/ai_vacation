import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  notifications: boolean;
  voiceRecognition: boolean;
  autoSave: boolean;
  language: string;
  aiModel: string;
}

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  voiceRecognition: true,
  autoSave: true,
  language: 'ko',
  aiModel: 'gpt-3.5-turbo',
};

const SETTINGS_KEY = 'app_settings';

class SettingsService {
  private settings: Settings = DEFAULT_SETTINGS;

  async initialize(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  }

  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<Settings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('설정 저장 실패:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      throw error;
    }
  }

  getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  async setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    await this.updateSettings({ [key]: value });
  }
}

export const settingsService = new SettingsService(); 