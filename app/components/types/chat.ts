export interface Message {
  type: 'user' | 'bot';
  content: string;
  isFAQ?: boolean;
  suggestions?: string[];
  isStreaming?: boolean;
}

export interface MessageChunk {
  type: 'answer' | 'related_question';
  body: string;
}