'use client'
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FinancialChatboxProps } from './types/chat';
import { useChatState } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import Image from 'next/image'
import MarkdownContent from './MarkdownContent';

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

  const renderHeader = () => {
    if (!initialState?.content) return null;

    const title = initialState.content.split('\n')[0];
    const titleWithoutMarkdown = title.replace(/^#+\s*|\*\*/g, '').trim();
    const contentWithoutTitle = initialState.content.split('\n').slice(1).join('\n');

    return (
      <>
        <div className="p-4">
          <h1 className="text-2xl font-bold">{titleWithoutMarkdown}</h1>
        </div>
        <div className="px-4">
          <MarkdownContent content={contentWithoutTitle} />
        </div>
      </>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50">
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-none shadow-lg flex flex-col h-full w-full overflow-hidden fixed inset-0">
        <ChatHeader onClose={onClose} />

        <div className="flex-1 overflow-y-auto">
          {renderHeader()}
          {initialState?.imageUrl && (
            <div className="w-full px-4">
              <Image 
                src={initialState.imageUrl} 
                alt="Company Image" 
                width={0}
                height={0}
                sizes="100vw"
                className="w-full rounded-lg"
              />
            </div>
          )}

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            latestMessageRef={latestMessageRef}
            onFAQClick={handleFAQClick}
          />
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