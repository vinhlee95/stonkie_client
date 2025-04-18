'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import MessageContent from './MessageContent';

interface Message {
  type: 'user' | 'bot';
  content: string;
  isFAQ?: boolean;  // Add this field to distinguish FAQ messages
  suggestions?: string[];  // Add this field for FAQ suggestions
  isStreaming?: boolean;  // Add this field to handle streaming messages
}

interface MessageChunk {
  type: 'answer' | 'related_question';
  body: string;
}

interface FinancialChatboxProps {
  onClose: () => void
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const ticker = params.ticker
  const latestMessageRef = useRef<HTMLDivElement>(null);

  const hasFetchedFAQs = useRef(false);

  useEffect(() => {
    setMessages([]);
  }, [ticker]);

  const handleFAQClick = async (question: string) => {
    setInput(question);
    // Simulate form submission with the selected question
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, question);
  };

  const handleSubmit = async (e: React.FormEvent, forcedInput?: string) => {
    e.preventDefault();
    const questionToAsk = forcedInput || input;
    if (!questionToAsk.trim()) return;

    // Add user message to chat
    const userMessage: Message = { type: 'user', content: questionToAsk };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/company/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: questionToAsk, ticker: ticker }),
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get reader');
      }

      // Add initial streaming message
      const streamingMessage: Message = {
        type: 'bot',
        content: '',
        isStreaming: true
      };
      setMessages(prev => [...prev, streamingMessage]);

      // Read the stream
      let accumulatedContent = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          // Split the chunk by newlines and process each JSON object separately
          const jsonStrings = chunk.split('\n').filter(str => str.trim());
          for (const jsonStr of jsonStrings) {
            const parsedChunk: MessageChunk = JSON.parse(jsonStr);
            
            if (parsedChunk.type === 'answer') {
              // Handle regular answer
              accumulatedContent += parsedChunk.body;
            } else if (parsedChunk.type === 'related_question') {
              // Handle related question - add it as a FAQ message
              setMessages(prev => [...prev, {
                type: 'bot',
                content: '',
                isFAQ: true,
                suggestions: [parsedChunk.body]
              }]);
            }
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }

        // Update the streaming message content with the full accumulated content
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];

          if (lastMessage.isStreaming) {
            lastMessage.content = accumulatedContent;
          }
          return newMessages;
        });
      }

      // Mark message as no longer streaming once complete
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

    } catch {
      // Add error message to chat
      const errorMessage: Message = {
        type: 'bot',
        content: 'Sorry, I encountered an error analyzing the data.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const fetchFAQsStream = async() => {    
    setIsLoading(true);
    try {
      const URL = ticker ? `${BACKEND_URL}/api/company/faq?ticker=${ticker}&stream=true` : `${BACKEND_URL}/api/company/faq?stream=true`
      const response = await fetch(URL);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get reader');
      }
      
      const questions: string[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        
        const lines = decoder.decode(value).split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            const jsonString = line.replace(/^data: /, '');
            const data = JSON.parse(jsonString);
            switch (data.type) {
              case 'question':
                questions.push(data.text);
                // Update or create FAQ message
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
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages.push({
                    type: 'user',
                    content: data.message,
                    isFAQ: false
                  })
                  return newMessages
                })
                break;
              case 'error':
                console.error('Error:', data.message);
                break;
            }
          }
        }
      }

      // Update the FAQ message when stream is complete
      setMessages(prev => {
        const newMessages = [...prev];
        const faqMessage = newMessages.find(m => m.isFAQ);
        if (faqMessage) {
          faqMessage.suggestions = questions;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Add error message if stream fails
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

  useEffect(() => {
    // When chat is visible, disable body scroll
    document.body.style.overflow = 'hidden';

    if (!hasFetchedFAQs.current) {
      hasFetchedFAQs.current = true;
      fetchFAQsStream();
    }

    return () => {
      // When chat is hidden, restore body scroll
      document.body.style.overflow = '';
    };
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'user' && latestMessageRef.current) {
        latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [messages]);

  return (
    <div className={`
      fixed 
      top-0 left-0 right-0 bottom-0
      w-full h-full
      z-50
    `}>
      <div className={`
        bg-[var(--background)]
        text-[var(--foreground)]
        rounded-none
        shadow-lg 
        flex flex-col 
        h-full w-full
        overflow-hidden
        fixed inset-0
      `}>
        <div className="fixed top-2 right-2 z-50 pr-4">
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pt-2 px-4 pb-16 w-full">
          {messages.map((message, index) => {
            const isLatest = index === messages.length - 1
            return (
              <div ref={isLatest && message.type === 'user' ? latestMessageRef : null} key={index}>
                <MessageContent 
                  content={message.content} 
                  isUser={message.type === 'user'}
                  isFAQ={message.isFAQ}
                  isLoading={isLoading}
                  suggestions={message.suggestions}
                  onFAQClick={handleFAQClick}
                />
              </div>
            )
          })}
        </div>
        
        {!isLoading && (
          <div className="flex-shrink-0 pb-4 px-4 pr-8 w-full fixed bottom-0 bg-transparent">
            <div className="relative max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask follow-up..."
                className="w-full bg-[#f5f5f5]/90 dark:bg-[#1C1C1C]/90 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-full py-3 pl-6 pr-12 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#333333] border border-gray-200/50 dark:border-[#333333]/50 shadow-lg backdrop-blur-sm transition-all duration-200"
              />
              <button
                onClick={handleSubmit}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200"
                aria-label="Submit question"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialChatbox;