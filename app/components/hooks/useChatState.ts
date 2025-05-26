import { useState, useRef, useEffect, useCallback } from 'react';

export interface Thread {
  id: string;
  question: string;
  thoughts: string[];
  answer: string | null;
  relatedQuestions: string[];
}

export const useChatState = (ticker: string | undefined) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const latestThreadRef = useRef<HTMLDivElement>(null);
  const hasFetchedFAQs = useRef(false);

  useEffect(() => {
    setThreads([]);
    setCurrentThreadId(null);
  }, [ticker]);

  useEffect(() => {
    if (threads.length > 0 && latestThreadRef.current) {
      latestThreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [threads]);

  const addThread = useCallback((question: string) => {
    const newThread: Thread = {
      id: Date.now().toString(),
      question,
      thoughts: [],
      answer: null,
      relatedQuestions: []
    };
    setThreads(prev => [...prev, newThread]);
    setCurrentThreadId(newThread.id);
    return newThread.id;
  }, []);

  const updateThread = useCallback((threadId: string, updates: Partial<Thread>) => {
    setThreads(prev => {
      const threadIndex = prev.findIndex(t => t.id === threadId);
      
      // If thread doesn't exist, create it
      if (threadIndex === -1) {
        const newThread: Thread = {
          id: threadId,
          question: updates.question || 'New Thread',
          thoughts: updates.thoughts || [],
          answer: updates.answer || null,
          relatedQuestions: updates.relatedQuestions || []
        };
        return [...prev, newThread];
      }

      // Update existing thread
      const updatedThreads = [...prev];
      updatedThreads[threadIndex] = {
        ...updatedThreads[threadIndex],
        ...updates
      };
      return updatedThreads;
    });
  }, []);

  return {
    threads,
    currentThreadId,
    setCurrentThreadId,
    input,
    setInput,
    latestThreadRef,
    hasFetchedFAQs,
    addThread,
    updateThread
  };
}; 