import React, { RefObject } from 'react';
import { Message } from './types/chat';
import MessageContent from './MessageContent';
import LoadingSkeleton from './LoadingSkeleton';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  thinkingStatus: string | null;
  latestMessageRef: RefObject<HTMLDivElement | null>;
  onFAQClick: (question: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  latestMessageRef,
  onFAQClick,
  thinkingStatus,
}) => {
  return (
    <div className="flex-grow overflow-y-auto pb-16 w-full">
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1;
        return (
          <div ref={isLatest && message.type === 'user' ? latestMessageRef : null} key={index}>
            <MessageContent
              content={message.content}
              isUser={message.type === 'user'}
              isFAQ={message.isFAQ}
              suggestions={message.suggestions}
              onFAQClick={onFAQClick}
              thinkingStatus={thinkingStatus}
            />
          </div>
        );
      })}
      {isLoading && <LoadingSkeleton />}
    </div>
  );
};

export default ChatMessages; 