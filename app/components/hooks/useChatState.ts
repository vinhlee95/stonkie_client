import { useState, useRef, useEffect } from 'react';
import { Message } from '../types/chat';

export const useChatState = (ticker: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const hasFetchedFAQs = useRef(false);
  const hasFetchedDetailedReport = useRef(false);

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
    input,
    setInput,
    latestMessageRef,
    hasFetchedFAQs,
    hasFetchedDetailedReport
  };
}; 