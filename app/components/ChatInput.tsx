import React from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSubmit, isLoading }) => {
  if (isLoading) return null;

  return (
    <div className="flex-shrink-0 pb-4 px-4 pr-8 w-full fixed bottom-0 bg-transparent">
      <div className="relative max-w-4xl mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
              setInput('');
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
  );
};

export default ChatInput; 