import { userStorage } from './storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';

// Message interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// API Response interface
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// API Service class
export class ApiService {
  private static instance: ApiService;
  private apiKey: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Initialize API key
  async initialize(): Promise<void> {
    this.apiKey = await userStorage.getApiKey();
  }

  // Set API key
  async setApiKey(apiKey: string): Promise<void> {
    await userStorage.saveApiKey(apiKey);
    this.apiKey = apiKey;
  }

  // Get current API key
  getApiKey(): string | null {
    return this.apiKey;
  }

  // Check if API key is set
  isApiKeySet(): boolean {
    return !!this.apiKey;
  }

  // Remove API key
  async removeApiKey(): Promise<void> {
    await userStorage.removeApiKey();
    this.apiKey = null;
  }

  // Send chat message to OpenAI
  async sendChatMessage(
    messages: ChatMessage[],
    model: string = DEFAULT_MODEL,
    maxTokens: number = 1000
  ): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
      };
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.choices[0]?.message?.content || '응답을 생성할 수 없습니다.'
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  // Send a simple text message
  async sendTextMessage(
    message: string,
    systemPrompt?: string,
    model: string = DEFAULT_MODEL,
    conversationContext?: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<ApiResponse> {
    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // 이전 대화 컨텍스트 추가
    if (conversationContext && conversationContext.length > 0) {
      // 최근 10개의 메시지만 포함 (토큰 제한 고려)
      const recentContext = conversationContext.slice(-10);
      messages.push(...recentContext.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    
    messages.push({
      role: 'user',
      content: message
    });

    return this.sendChatMessage(messages, model);
  }

  // Convert image URI to base64
  private async imageUriToBase64(uri: string): Promise<string> {
    try {
      // 이미 base64 형식인 경우 (웹에서 ImagePicker가 base64를 반환하는 경우)
      if (uri.startsWith('data:image/')) {
        const base64 = uri.split(',')[1];
        return base64;
      }
      
      // 웹 환경에서는 fetch를 사용하여 이미지를 blob으로 가져온 후 base64로 변환
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // data:image/jpeg;base64, 부분을 제거
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // 네이티브 환경에서는 expo-file-system 사용
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      throw new Error('이미지를 변환하는데 실패했습니다.');
    }
  }

  // Analyze image with text (accepts URI)
  async analyzeImage(
    imageUri: string,
    prompt: string,
    model: string = 'gpt-4o'
  ): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
      };
    }

    try {
      const base64Image = await this.imageUriToBase64(imageUri);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Image Analysis API Error:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.choices[0]?.message?.content || '이미지 분석을 완료할 수 없습니다.'
      };
    } catch (error) {
      console.error('Image Analysis Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 분석 중 오류가 발생했습니다.'
      };
    }
  }

  // Analyze image with base64 (for backward compatibility)
  async analyzeImageBase64(
    imageBase64: string,
    prompt: string,
    model: string = 'gpt-4o'
  ): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.choices[0]?.message?.content || '이미지 분석을 완료할 수 없습니다.'
      };
    } catch (error) {
      console.error('Image Analysis Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 분석 중 오류가 발생했습니다.'
      };
    }
  }

  // Transcribe audio
  async transcribeAudio(
    audioBase64: string,
    format: string = 'webm'
  ): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          file: `data:audio/${format};base64,${audioBase64}`,
          model: 'whisper-1',
          response_format: 'text',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.text();
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Transcription Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '음성 인식 중 오류가 발생했습니다.'
      };
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance(); 