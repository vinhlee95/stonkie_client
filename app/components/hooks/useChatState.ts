import { useState, useRef, useEffect } from 'react';
import { Message } from '../types/chat';

export const useChatState = (ticker: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingStatus, setThinkingStatus] = useState<string|null>(null);
  const [input, setInput] = useState('');
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const hasFetchedFAQs = useRef(false);

  useEffect(() => {
    setMessages([]);
  }, [ticker]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'user' && latestMessageRef.current) {
        latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [messages]);

  return {
    messages,
    setMessages,
    thinkingStatus,
    setThinkingStatus,
    input,
    setInput,
    latestMessageRef,
    hasFetchedFAQs,
  };
}; 