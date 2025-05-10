import { useState, Dispatch, SetStateAction } from 'react';
import { Message } from '../types/chat';
import { chatService } from '../services/chatService';

export const useChatAPI = (
  ticker: string | undefined, 
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setThinkingStatus: Dispatch<SetStateAction<string | null>>,
) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { type: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reader = await chatService.analyzeQuestion(question, ticker);
      if (!reader) throw new Error('Failed to get reader');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      const streamingMessage: Message = {
        type: 'bot',
        content: '',
        isStreaming: true
      };
      setMessages(prev => [...prev, streamingMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          const jsonStrings = chunk.split('\n').filter(str => str.trim());
          for (const jsonStr of jsonStrings) {
            const parsedChunk = JSON.parse(jsonStr);
            if (parsedChunk.type === 'answer') {
              accumulatedContent += parsedChunk.body;
            } else if (parsedChunk.type === 'thinking_status') {
              setThinkingStatus(parsedChunk.body);
            } else if (parsedChunk.type === 'related_question') {
              setMessages(prev => [...prev, {
                type: 'bot',
                content: '',
                isFAQ: true,
                suggestions: [parsedChunk.body]
              }]);
            }
          }
        } catch {}

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.isStreaming) {
            lastMessage.content = accumulatedContent;
          }
          return newMessages;
        });
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

    } catch (_) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, I encountered an error analyzing the data.'
      }]);
    } finally {
      setIsLoading(false);
      setThinkingStatus(null);
    }
  };

  const fetchFAQsStream = async () => {
    setIsLoading(true);
    try {
      const reader = await chatService.fetchFAQs(ticker);
      if (!reader) throw new Error('Failed to get reader');

      const decoder = new TextDecoder();
      const questions: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const jsonString = line.replace(/^data: /, '');
            const data = JSON.parse(jsonString);
            switch (data.type) {
              case 'question':
                questions.push(data.text);
                setMessages(prev => {
                  const newMessages = [...prev];
                  const faqMessage = newMessages.find(m => m.isFAQ);
                  if (faqMessage) {
                    faqMessage.suggestions = questions;
                  } else {
                    newMessages.push({
                      type: 'bot',
                      content: "",
                      isFAQ: true,
                      suggestions: questions
                    });
                  }
                  return newMessages;
                });
                break;
              case 'status':
                setMessages(prev => [...prev, {
                  type: 'user',
                  content: data.message,
                  isFAQ: false
                }]);
                break;
              case 'error':
                console.error('Error:', data.message);
                break;
            }
          }
        }
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const faqMessage = newMessages.find(m => m.isFAQ);
        if (faqMessage) {
          faqMessage.suggestions = questions;
        }
        return newMessages;
      });
    } catch (_) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "Sorry, I encountered an error generating questions.",
        isFAQ: true,
        suggestions: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedReport = async (slug: string) => {
    try {
      const reader = await chatService.fetchDetailedReport(ticker, slug);
      if (!reader) throw new Error('Failed to get reader');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      const streamingMessage: Message = {
        type: 'bot',
        content: '',
        isStreaming: true
      };
      setMessages(prev => [...prev, streamingMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          const jsonStrings = chunk.split('\n').filter(str => str.trim());
          for (const jsonStr of jsonStrings) {
            const parsedChunk = JSON.parse(jsonStr);
            accumulatedContent += parsedChunk || '';
            
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.isStreaming) {
                return newMessages.map((msg, idx) => 
                  idx === newMessages.length - 1 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                );
              }
              return newMessages;
            });
          }
        } catch {}
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
          return newMessages.map((msg, idx) => 
            idx === newMessages.length - 1 
              ? { ...msg, isStreaming: false }
              : msg
          );
        }
        return newMessages;
      });

    } catch (_) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, I encountered an error fetching the detailed report.'
      }]);
    }
  };

  return {
    handleSubmit,
    fetchFAQsStream,
    fetchDetailedReport,
    isLoading
  };
}; 