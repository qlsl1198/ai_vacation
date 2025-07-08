import { apiService } from './api';

class ImageAnalysisService {
  private static instance: ImageAnalysisService;

  private constructor() {}

  public static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  public async analyzeImage(imageUri: string, customPrompt?: string): Promise<string> {
    try {
      // API 키 확인
      if (!apiService.isApiKeySet()) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenAI API 키를 입력해주세요.');
      }

      const prompt = customPrompt || '이 이미지에 대해 자세히 설명해주세요. 이미지의 내용, 색상, 구성, 그리고 전반적인 느낌을 한국어로 설명해주세요.';
      
      const response = await apiService.analyzeImage(imageUri, prompt);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '이미지 분석에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 분석 오류:', error);
      throw error;
    }
  }

  // 이미지 분석 결과를 AI로 개선
  public async enhanceAnalysis(analysis: string): Promise<string> {
    try {
      if (!apiService.isApiKeySet()) {
        return analysis; // API 키가 없으면 원본 반환
      }

      const systemPrompt = `당신은 이미지 분석 결과를 개선하는 전문가입니다. 
주어진 분석 결과를 더 자세하고 유용한 정보로 개선해주세요.
한국어로 응답하고, 사용자가 이미지에 대해 더 잘 이해할 수 있도록 도와주세요.`;
      
      const response = await apiService.sendTextMessage(
        `다음 이미지 분석 결과를 개선해주세요: "${analysis}"`,
        systemPrompt
      );

      if (response.success) {
        return response.data;
      } else {
        return analysis; // API 실패 시 원본 반환
      }
    } catch (error) {
      console.error('분석 결과 개선 오류:', error);
      return analysis; // 오류 시 원본 반환
    }
  }

  // 이미지에서 텍스트 추출 (OCR 기능)
  public async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      if (!apiService.isApiKeySet()) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenAI API 키를 입력해주세요.');
      }

      const prompt = '이 이미지에서 모든 텍스트를 추출해주세요. 텍스트가 있다면 정확히 읽어서 알려주세요.';
      
      const response = await apiService.analyzeImage(imageUri, prompt);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '텍스트 추출에 실패했습니다.');
      }
    } catch (error) {
      console.error('텍스트 추출 오류:', error);
      throw error;
    }
  }

  // 이미지 설명 생성
  public async generateImageDescription(imageUri: string): Promise<string> {
    try {
      if (!apiService.isApiKeySet()) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenAI API 키를 입력해주세요.');
      }

      const prompt = '이 이미지를 간결하고 명확하게 설명해주세요. 주요 요소들과 전체적인 분위기를 포함해서 설명해주세요.';
      
      const response = await apiService.analyzeImage(imageUri, prompt);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '이미지 설명 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 설명 생성 오류:', error);
      throw error;
    }
  }
}

export default ImageAnalysisService; 