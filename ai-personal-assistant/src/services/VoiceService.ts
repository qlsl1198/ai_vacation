import * as Speech from 'expo-speech';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { apiService } from './api';
import * as FileSystem from 'expo-file-system';

class VoiceService {
  private static instance: VoiceService;
  private isListening: boolean = false;
  private audioUri: string | null = null;

  private constructor() {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private onSpeechResults(e: SpeechResultsEvent) {
    return e.value;
  }

  private onSpeechError(e: SpeechErrorEvent) {
    console.error('음성 인식 오류:', e);
  }

  public async startListening(
    onResult: (results: string[]) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      await Voice.start('ko-KR');
      this.isListening = true;

      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value) {
          onResult(e.value);
        }
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        onError(e);
        this.isListening = false;
      };
    } catch (error) {
      onError(error);
      this.isListening = false;
    }
  }

  public async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('음성 인식 중지 오류:', error);
    }
  }

  // OpenAI Whisper API를 사용한 음성 인식
  public async transcribeAudioWithAPI(audioUri: string): Promise<string> {
    try {
      // API 키 확인
      if (!apiService.isApiKeySet()) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenAI API 키를 입력해주세요.');
      }

      // 오디오 파일을 base64로 변환
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // OpenAI Whisper API 호출
      const response = await apiService.transcribeAudio(base64Audio, 'webm');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '음성 인식에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 음성 인식 오류:', error);
      throw error;
    }
  }

  // 하이브리드 음성 인식 (로컬 + API)
  public async startHybridListening(
    onResult: (results: string[]) => void,
    onError: (error: any) => void,
    useAPI: boolean = false
  ): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      if (useAPI) {
        // API 기반 음성 인식 (실제 구현에서는 오디오 녹음 기능 필요)
        console.log('API 기반 음성 인식 시작');
        // 여기서는 로컬 음성 인식을 사용하고, 필요시 API로 보완
      }

      await Voice.start('ko-KR');
      this.isListening = true;

      Voice.onSpeechResults = async (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          let results = e.value;
          
          // API 키가 설정되어 있고, 로컬 결과가 부정확할 수 있는 경우 API로 보완
          if (apiService.isApiKeySet() && useAPI) {
            try {
              // 로컬 결과를 API로 개선 (실제로는 오디오 파일을 API로 전송)
              const improvedResult = await this.improveTranscriptionWithAPI(e.value[0]);
              results = [improvedResult];
            } catch (apiError) {
              console.log('API 보완 실패, 로컬 결과 사용:', apiError);
            }
          }
          
          onResult(results);
        }
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        onError(e);
        this.isListening = false;
      };
    } catch (error) {
      onError(error);
      this.isListening = false;
    }
  }

  // API를 사용하여 음성 인식 결과 개선
  private async improveTranscriptionWithAPI(text: string): Promise<string> {
    try {
      const systemPrompt = `당신은 음성 인식 결과를 개선하는 전문가입니다. 
주어진 텍스트가 음성 인식으로 생성된 것이라면, 문맥에 맞게 수정하고 개선해주세요.
한국어로 응답하고, 원문의 의미를 유지하면서 자연스럽게 만들어주세요.`;

      const response = await apiService.sendTextMessage(
        `다음 음성 인식 결과를 개선해주세요: "${text}"`,
        systemPrompt
      );

      if (response.success) {
        return response.data;
      } else {
        return text; // API 실패 시 원본 반환
      }
    } catch (error) {
      console.error('음성 인식 개선 오류:', error);
      return text; // 오류 시 원본 반환
    }
  }

  public async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'ko-KR',
        pitch: 1,
        rate: 0.9,
      });
    } catch (error) {
      console.error('음성 합성 오류:', error);
    }
  }

  public isRecording(): boolean {
    return this.isListening;
  }

  public async destroy(): Promise<void> {
    try {
      await Voice.destroy();
    } catch (error) {
      console.error('음성 인식 정리 오류:', error);
    }
  }
}

export default VoiceService; 