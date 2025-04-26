'use client'
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FinancialChatboxProps } from './types/chat';
import { useChatState } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({ onClose, initialState }) => {
  const params = useParams();
  const ticker = params.ticker as string | undefined;

  const {
    messages,
    setMessages,
    input,
    setInput,
    latestMessageRef,
    hasFetchedFAQs,
    hasFetchedDetailedReport
  } = useChatState(ticker);

  const { handleSubmit, fetchFAQsStream, fetchDetailedReport, isLoading } = useChatAPI(ticker, setMessages);

  const handleFAQClick = async (question: string) => {
    await handleSubmit(question);
  };

  useEffect(() => {
    // When chat is visible, disable body scroll
    document.body.style.overflow = 'hidden';

    // If initial state is provided, call a separate API endpoint to get the analysis content of the initial state
    if (initialState && !hasFetchedDetailedReport.current) {
      hasFetchedDetailedReport.current = true;
      fetchDetailedReport(initialState.slug);
      return;
    }

    if (!hasFetchedFAQs.current && !initialState) {
      hasFetchedFAQs.current = true;
      fetchFAQsStream();
    }

    return () => {
      // When chat is hidden, restore body scroll
      document.body.style.overflow = '';
    };
  }, [initialState, hasFetchedDetailedReport, hasFetchedFAQs, fetchDetailedReport, fetchFAQsStream]);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50">
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-none shadow-lg flex flex-col h-full w-full overflow-hidden fixed inset-0">
        <ChatHeader onClose={onClose} />
        
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          latestMessageRef={latestMessageRef}
          onFAQClick={handleFAQClick}
        />
        
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