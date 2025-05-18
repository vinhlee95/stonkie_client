'use client'
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FinancialChatboxProps } from './types/chat';
import { useChatState } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({ onClose, initialState, children }) => {
  const params = useParams();
  const ticker = params.ticker as string | undefined;

  const {
    messages,
    setMessages,
    thinkingStatus,
    setThinkingStatus,
    input,
    setInput,
    latestMessageRef,
    hasFetchedFAQs,
  } = useChatState(ticker);

  const { handleSubmit, fetchFAQsStream, isLoading } = useChatAPI(ticker, setMessages, setThinkingStatus);

  const handleFAQClick = async (question: string) => {
    await handleSubmit(question);
  };

  useEffect(() => {
    // When chat is visible, disable body scroll
    document.body.style.overflow = 'hidden';

    if (!hasFetchedFAQs.current && !initialState) {
      hasFetchedFAQs.current = true;
      fetchFAQsStream();
    }

    return () => {
      // When chat is hidden, restore body scroll
      document.body.style.overflow = '';
    };
  }, [initialState, hasFetchedFAQs, fetchFAQsStream]);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50">
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-none shadow-lg flex flex-col h-full w-full overflow-hidden fixed inset-0">
        <ChatHeader onClose={onClose} />

        <div className="flex-1 overflow-y-auto px-4 mt-4">
          <div className="w-full max-w-4xl mx-auto">
            {children}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              thinkingStatus={thinkingStatus}
              latestMessageRef={latestMessageRef}
              onFAQClick={handleFAQClick}
            />
          </div>
        </div>
        
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={() => handleSubmit(input)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default FinancialChatbox;