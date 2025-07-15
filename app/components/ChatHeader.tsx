import React from 'react';
import { Maximize, Minus, Minimize } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, onMaximize, isMaximized }) => {
  return (
    <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 bg-[var(--background)] px-4 py-2">
      <button
        onClick={onMaximize}
        className="hidden md:inline-flex p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded w-8 h-8"
        aria-label={isMaximized ? 'Minimize' : 'Maximize'}
        aria-pressed={isMaximized}
      >
        {isMaximized ? (
          <Minimize className='w-6 h-6' />
        ) : (
          <Maximize className='w-6 h-6' />
        )}
      </button>

      <button
        onClick={onClose}
        className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded w-8 h-8"
        aria-label="Close"
      >
        <Minus className='w-6 h-6' />
      </button>
    </div>
  );
};

export default ChatHeader; 