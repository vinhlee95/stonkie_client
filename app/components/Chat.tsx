'use client'
import React, { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ListPlus, FileSearch } from 'lucide-react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { useChatState, Thread } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import { ThoughtBubble } from './ThoughtBubble';
import { Plus } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import ResourceChips from './ResourceChips';

interface FinancialChatboxProps {
  onClose: () => void;
  children?: React.ReactNode;
  type?: 'chat' | 'report';
  isDesktop?: boolean;
}

interface ThreadViewProps {
  thread: Thread;
  onFAQClick: (question: string) => void;
  isFirstThread: boolean;
  isLastThread: boolean;
  isThinking: boolean;
}

const ThreadView: React.FC<ThreadViewProps> = ({ thread, onFAQClick, isFirstThread, isLastThread, isThinking }) => {
  return (
    <div className='mb-8'>
      <div className="text-2xl font-medium mb-2">{thread.question}</div>
      {/* Do not show AI thought in first FAQ section */}
      {!isFirstThread && (
        <div className="mb-4">
          {/* Only show thoughts bubble in the latest thread so that bubble from previous threads do not change */}
          <ThoughtBubble thought={thread.thoughts[thread.thoughts.length - 1]} isThinking={isThinking && isLastThread} />
        </div>
      )}
      {thread.answer && (
        <MarkdownContent content={thread.answer} />
      )}
      
      {thread.grounds && thread.grounds.length > 0 && (
        <>
          <div className='flex my-4'>
            <FileSearch />
            <div className="font-semibold">Sources</div>
          </div>
          <ResourceChips resources={thread.grounds.map(i => ({url: i.url, label: i.body}))} />
        </>
      )}
      {thread.relatedQuestions.length > 0 && (
        <div>
          {!isFirstThread && (
            <div className='flex mt-6'>
              <ListPlus />
              <div className="font-semibold">Related</div>
            </div>
          )}
          <>
            {thread.relatedQuestions.map((question, index) => (
              <div
                key={index}
                onClick={() => onFAQClick?.(question)}
                className="group flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer rounded px-2 transition-colors duration-200"
              >
                <p className="text-gray-900 dark:text-white flex-1 pr-2 transition-colors duration-200 group-hover:text-[var(--accent-hover)] dark:group-hover:text-[var(--accent-hover-dark)]">
                  {question}
                </p>
                <Plus className="h-5 w-5 text-[#171717] dark:text-[#ededed] transition-colors duration-200 group-hover:text-[var(--accent-hover)] dark:group-hover:text-[var(--accent-hover-dark)]" />
              </div>
            ))}
          </>
        </div>
      )}
    </div>
  );
};

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({ onClose, children, type = 'chat', isDesktop }) => {
  const params = useParams();
  const ticker = params.ticker as string | undefined;
  const latestThreadRef = useRef<HTMLDivElement>(null);

  const {
    threads,
    input,
    setInput,
    hasFetchedFAQs,
    addThread,
    updateThread
  } = useChatState(ticker);
  
  useEffect(() => {
    if(latestThreadRef.current) {
      latestThreadRef.current.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }, [threads.length])

  const { handleSubmit, fetchFAQsStream, isLoading, isThinking, cancelRequest } = useChatAPI(ticker, updateThread);

  const handleFAQClick = async (question: string) => {
    const threadId = addThread(question);
    await handleSubmit(question, threadId);
  };

  useEffect(() => {
    // When chat is visible, disable body scroll
    if(!isDesktop) {
      document.body.style.overflow = 'hidden';
    }

    if (!hasFetchedFAQs.current && type === 'chat') {
      hasFetchedFAQs.current = true;
      fetchFAQsStream();
    }

    return () => {
      // When chat is hidden, restore body scroll
      document.body.style.overflow = '';
    };
  }, [hasFetchedFAQs, fetchFAQsStream]);

  return (
    <div className={`fixed z-50 overflow-x-hidden ${isDesktop ? 'md:fixed md:top-[15vh] md:right-8 md:left-auto md:h-[80vh] md:max-h-[80vh] md:w-[40vw] md:max-w-[50vw] md:shadow-[0_2px_16px_rgba(0,0,0,0.15)] md:z-50 md:rounded-xl md:overflow-x-hidden' : 'top-0 left-0 right-0 bottom-0 w-full h-full'}`}>
      <div
        className={`bg-[var(--background)] text-[var(--foreground)] rounded-none shadow-lg flex flex-col h-full w-full overflow-hidden overflow-x-hidden ${isDesktop ? 'md:h-full md:w-full md:flex md:flex-col md:rounded-xl md:overflow-x-hidden' : ''}`}>
        <ChatHeader onClose={onClose} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 mt-4">
          <div className="w-full max-w-4xl mx-auto">
            {children}
            {threads.map((thread, index) => (
              <div
                key={thread.id}
                ref={index === threads.length - 1 ? latestThreadRef : undefined}
              >
                <ThreadView 
                  thread={thread} 
                  onFAQClick={handleFAQClick} 
                  isFirstThread={index === 0}
                  isLastThread={index === threads.length - 1}
                  isThinking={isThinking}
                />
              </div>
            ))}
          </div>
        </div>
        
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={async () => {
            if (input.trim()) {
              const threadId = addThread(input);
              await handleSubmit(input, threadId);
              setInput('');
            }
          }}
          isLoading={isLoading}
          onCancel={cancelRequest}
        />
      </div>
    </div>
  );
};

export default FinancialChatbox;