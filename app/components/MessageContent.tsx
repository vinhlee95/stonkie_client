import React from 'react';
import Image from 'next/image';
import MarkdownContent from './MarkdownContent';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  isFAQ?: boolean;
  suggestions?: string[];
  onFAQClick?: (question: string) => void;
  thinkingStatus: string | null;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isUser, 
  isFAQ, 
  suggestions,
  onFAQClick,
  thinkingStatus,
}) => {
  if (isUser) {
    return (
      <p className="text-gray-900 dark:text-white text-xl font-medium mb-4 mt-4 leading-relaxed">
        {content}
      </p>
    );
  }

  if (isFAQ && suggestions) {
    return (
      <>
        {content && <p className="mb-2 text-gray-900 dark:text-white">{content}</p>}
        <div className="flex flex-col">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => onFAQClick?.(suggestion)}
              className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2"
            >
              <p className="text-gray-900 dark:text-white flex-1 pr-2">
                {suggestion}
              </p>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-blue-600 dark:text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </div>
          ))}
        </div>
      </>
    );
  }

  return <BotMessage content={content} thinkingStatus={thinkingStatus} />;
};

const BotMessage: React.FC<{ content: string, thinkingStatus: string | null }> = ({ content, thinkingStatus }) => (
  <div className="max-w-4xl mx-auto w-full">
    <BotHeader thinkingStatus={thinkingStatus} />
    <MarkdownContent content={content} />
  </div>
);

const BotHeader = ({thinkingStatus}: {thinkingStatus: string | null}) => (
  <div
    className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-full p-2 px-4 shadow-sm inline-flex max-w-max mb-2"
  >
    <Image
      src="/stonkie.png"
      alt="Stonkie Avatar"
      width={24}
      height={24}
      className="rounded-full"
    />
    <p className="text-gray-500 font-bold">
      {thinkingStatus ?? 'Stonkie'}
    </p>
  </div>
);

export default MessageContent; 