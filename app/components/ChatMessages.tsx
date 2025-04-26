import React, { RefObject } from 'react';
import { Message } from './types/chat';
import MessageContent from './MessageContent';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  latestMessageRef: RefObject<HTMLDivElement | null>;
  onFAQClick: (question: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  latestMessageRef,
  onFAQClick
}) => {
  return (
    <div className="flex-grow overflow-y-auto pt-2 px-4 pb-16 w-full">
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1;
        return (
          <div ref={isLatest && message.type === 'user' ? latestMessageRef : null} key={index}>
            <MessageContent
              content={message.content}
              isUser={message.type === 'user'}
              isFAQ={message.isFAQ}
              isLoading={isLoading}
              suggestions={message.suggestions}
              onFAQClick={onFAQClick}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages; 