import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  isFAQ?: boolean;
  suggestions?: string[];
  onFAQClick?: (question: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isUser, 
  isFAQ, 
  suggestions,
  onFAQClick 
}) => {
  if (isUser) {
    return (
      <p className="text-gray-900 dark:text-white">
        {content}
      </p>
    );
  }

  if (isFAQ && suggestions) {
    return (
      <div className="py-2 w-full">
        {content && <p className="mb-2 text-gray-900 dark:text-white">{content}</p>}
        <div className="flex flex-col">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => onFAQClick?.(suggestion)}
              className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
      </div>
    );
  }

  return <BotMessage content={content} />;
};

const BotMessage: React.FC<{ content: string }> = ({ content }) => (
  <div>
    <BotHeader />
    <MarkdownContent content={content} />
  </div>
);

const BotHeader: React.FC = () => (
  <div
    className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-2 shadow-sm"
  >
    <img
      src="/stonkie.png"
      alt="Stonkie Avatar"
      className="w-6 h-6 rounded-full"
    />
    <p className="text-gray-500 font-bold">
      Stonkie
    </p>
  </div>
);

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => (
  <div>
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h3 className="font-bold mt-4 mb-2 text-lg text-gray-900 dark:text-white">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-1.5 text-gray-900 dark:text-white">{children}</p>
        ),
        strong: ({ children }) => (
          <span className="font-bold">
            {children}
          </span>
        ),
        ul: ({ children }) => (
          <ul className="pl-4 mb-1.5 list-disc">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="mb-0.5">
            {children}
          </li>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-sm border-collapse">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 p-2 bg-gray-100 text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 p-2">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default MessageContent; 