import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { ArrowUp, Square, Globe } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel?: () => void;
  useGoogleSearch: boolean
  setUseGoogleSearch: Dispatch<SetStateAction<boolean>>
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSubmit, isLoading, onCancel, useGoogleSearch, setUseGoogleSearch }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  return (
    <div className="flex-shrink-0 pb-4 px-4 w-full bg-transparent">
      <div className="max-w-4xl mx-auto flex flex-col gap-2 border border-gray-200 dark:border-gray-700 rounded-xl">
        {/* First row: Textarea */}
        <textarea
          disabled={isLoading}
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
              setInput('');
            }
          }}
          placeholder="Ask follow-up..."
          rows={1}
          className="w-full text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 py-3 pl-6 pr-6 focus:outline-none focus:ring-gray-300 dark:focus:ring-[#333333] transition-all duration-200 resize-none overflow-hidden bg-transparent rounded-t-xl"
          style={{ minHeight: '48px' }}
        />
        {/* Second row: Icons aligned right */}
        <div className="flex justify-end items-center gap-2 pr-2 pb-2">
          <div className="relative group">
            <button
              type="button"
              className={`p-2 cursor-pointer rounded-full transition-colors ${useGoogleSearch ? 'bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)]' : 'hover:bg-gray-100 dark:hover:bg-[#232323]'}`}
              aria-label="Web search"
              onClick={() => setUseGoogleSearch(!useGoogleSearch)} 
            >
              <Globe className={`w-4 h-4 ${useGoogleSearch ? 'text-white dark:text-[#ededed]' : 'text-gray-500 dark:text-gray-400'}`} />
            </button>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-10 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Enable Google Search
            </div>
          </div>
          <button
            onClick={isLoading ? onCancel : e => {
              e.preventDefault();
              handleSubmit(e);
              setInput('');
            }}
            className={`p-2 cursor-pointer rounded-full flex items-center justify-center transition-colors duration-200 ${
              isLoading
                ? 'bg-[var(--accent-danger)]'
                : 'bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)]'
            }`}
            aria-label={isLoading ? "Stop request" : "Submit question"}
            type="button"
          >
            {isLoading ? (
              <Square className="h-4 w-4 text-white dark:text-[#ededed]" />
            ) : (
              <ArrowUp className="h-4 w-4 text-white dark:text-[#ededed]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 