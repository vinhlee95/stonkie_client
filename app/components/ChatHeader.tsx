import React from 'react';

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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize-icon lucide-minimize">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-icon lucide-maximize">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        )}
      </button>

      <button
        onClick={onClose}
        className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded w-8 h-8"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-icon lucide-minus">
          <path d="M5 12h14" /></svg>
      </button>
    </div>
  );
};

export default ChatHeader; 