import axios from 'axios';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

class ChatService {
  private static instance: ChatService;
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1/chat/completions';

  private constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async sendMessage(messages: Message[]): Promise<string> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: 'gpt-3.5-turbo',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI 응답 오류:', error);
      throw new Error('AI 응답을 받아오는데 실패했습니다.');
    }
  }
}

export default ChatService; 