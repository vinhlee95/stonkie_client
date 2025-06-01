import React, { useEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSubmit, isLoading, onCancel }) => {
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
    <div className="flex-shrink-0 pb-4 px-4 pr-8 w-full fixed bottom-0 bg-transparent">
      <div className="relative max-w-4xl mx-auto">
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
          className="w-full bg-[#f5f5f5]/90 dark:bg-[#1C1C1C]/90 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl py-3 pl-6 pr-12 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#333333] border border-gray-200/50 dark:border-[#333333]/50 shadow-lg backdrop-blur-sm transition-all duration-200 resize-none overflow-hidden"
          style={{ minHeight: '48px' }}
        />
        <button
          onClick={isLoading ? onCancel : handleSubmit}
          className={`cursor-pointer absolute right-3 bottom-3.5 w-8 h-8 flex items-center justify-center rounded-xl ${
            isLoading 
              ? 'bg-[var(--accent-danger)]' 
              : 'bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)]'
          } transition-colors duration-200`}
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
  );
};

export default ChatInput; 