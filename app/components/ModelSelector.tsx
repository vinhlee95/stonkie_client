'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Zap, Cpu } from 'lucide-react'

export interface ModelOption {
  label: string
  value: string
}

const MODEL_OPTIONS: ModelOption[] = [
  { label: 'Lightning', value: 'fastest' },
  { label: 'Gemini 3.0 Flash', value: 'gemini-3.0-flash' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
]

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption =
    MODEL_OPTIONS.find((opt) => opt.value === selectedModel) || MODEL_OPTIONS[0]

  const getModelIcon = (value: string) => {
    if (value === 'fastest') {
      return <Zap className="w-3.5 h-3.5" />
    }
    return <Cpu className="w-3.5 h-3.5" />
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (value: string) => {
    onModelChange(value)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#232323] rounded-full transition-colors cursor-pointer"
        aria-label="Select model"
      >
        {getModelIcon(selectedOption.value)}
        <span className="font-medium">{selectedOption.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {MODEL_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <div className="h-px bg-gray-200 dark:bg-gray-700" />}
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  selectedModel === option.value
                    ? 'bg-gray-50 dark:bg-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === MODEL_OPTIONS.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {getModelIcon(option.value)}
                  <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                </div>
                {selectedModel === option.value && (
                  <Check className="w-4 h-4 text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]" />
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
