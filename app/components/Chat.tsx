'use client'
import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MessageContent from './MessageContent';
import ChatInput from './ChatInput';
import LoadingInput from './LoadingInput';

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
  ticker: string | undefined;  // Current ticker passed from parent component
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({ ticker }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasFetchedFAQs, setHasFetchedFAQs] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setMessages([]);
    setHasFetchedFAQs(false);
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

    } catch (error) {
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

  // Add this useEffect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      let hasAddedInitialStatus = false;

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
                if (!hasAddedInitialStatus) {
                  // Add first status message as a separate chat message
                  setMessages(prev => [...prev, {
                    type: 'bot',
                    content: data.message
                  }]);
                  hasAddedInitialStatus = true;
                }
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

  const handleChatOpen = () => {
    setIsVisible(true);
    if (!hasFetchedFAQs) {
      fetchFAQsStream();
      setHasFetchedFAQs(true);
    }
  };

  // Modify the useEffect for body overflow control
  useEffect(() => {
    if (isMaximized || (isVisible && window.innerWidth <= 600)) { // Check for mobile viewport
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed'; // Prevent bounce effect on iOS
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.body.style.height = 'auto';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.body.style.height = 'auto';
    };
  }, [isMaximized, isVisible]);

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: isMaximized ? 0 : 'auto',
      bottom: { xs: 0, sm: isMaximized ? 0 : 20 },
      right: { xs: 0, sm: isMaximized ? 0 : 20 },
      maxWidth: { xs: '100%', sm: isMaximized ? '100%' : '90%' },
      width: { xs: '100%', sm: isMaximized ? '100%' : 800 },
      px: { xs: 0, sm: 0 },
    }}>
      {!isVisible && (
        <Button 
          onClick={handleChatOpen}
          variant="contained" 
          sx={{ 
            minWidth: 'auto',
            width: 56,
            height: 56,
            borderRadius: '50%',
            float: 'right',
            mr: { xs: 4, sm: 0 },
            mb: { xs: 4, sm: 0 }
          }}
        >
          <ChatBubbleIcon />
        </Button>
      )}
      
      {isVisible && (
        <Paper elevation={3} sx={{ 
          p: { xs: '0', sm: '4px 0 4px 0' },
          clear: 'both', 
          position: 'relative',
          borderRadius: { 
            xs: '16px 16px 0 0', 
            sm: isMaximized ? 0 : 4 
          },
          height: isMaximized ? '100%' : { xs: '100vh', sm: '80vh' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Maximize button - desktop only */}
          <Button 
            onClick={() => setIsMaximized(prev => !prev)}
            sx={{ 
              minWidth: 'auto',
              width: 32,
              height: 32,
              p: 0,
              position: 'absolute',
              top: { xs: 8, sm: 8 },
              right: { xs: 48, sm: 48 },
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              boxShadow: 1,
              zIndex: 1200,
              display: { xs: 'none', sm: 'flex' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <Typography sx={{ fontSize: '32px' }}>
              {isMaximized ? '-' : '⤢'}
            </Typography>
          </Button>
          
          {/* Close button */}
          <Button 
            onClick={() => {
              setIsMaximized(false);  // Reset maximized state when closing
              setIsVisible(false);
            }}
            sx={{ 
              minWidth: 'auto',
              width: 32,
              height: 32,
              p: 0,
              position: 'absolute',
              top: { xs: 8, sm: 8 },
              right: { xs: 8, sm: 8 },
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              boxShadow: 1,
              zIndex: 1200,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <Typography sx={{ fontSize: '20px' }}>✕</Typography>
          </Button>
          
          <Box sx={{ 
            height: 'auto',
            overflowY: 'auto',
            mb: 1,
            position: 'relative',
            px: 0,
            flex: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
            pb: 10
          }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1,
                  position: 'relative',
                  mt: index === 0 ? 2 : 0,
                  px: { xs: 4, sm: 4 },
                }}
              >
                <MessageContent 
                  content={message.content} 
                  isUser={message.type === 'user'}
                  isFAQ={message.isFAQ}
                  suggestions={message.suggestions}
                  onFAQClick={handleFAQClick}
                />
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {isLoading ? (
            <LoadingInput />
          ) : (
            <ChatInput
              input={input}
              isLoading={isLoading}
              ticker={ticker}
              messagesExist={messages.length > 0}
              onInputChange={setInput}
              onSubmit={handleSubmit}
            />
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FinancialChatbox;