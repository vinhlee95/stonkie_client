'use client'

import { useState, useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Database,
  Globe,
  ListPlus,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { AnalysisPhase, ThoughtStep } from './hooks/useChatState'

const phaseIcon: Record<AnalysisPhase, React.ElementType> = {
  classify: Brain,
  data_fetch: Database,
  search: Globe,
  analyze: Sparkles,
  enrich: ListPlus,
}

function StepIcon({ phase, isActive }: { phase: AnalysisPhase; isActive: boolean }) {
  const Icon = phaseIcon[phase] || Sparkles
  return (
    <Icon
      className={`w-3.5 h-3.5 flex-shrink-0 ${
        isActive
          ? 'text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]'
          : 'text-gray-400 dark:text-gray-500'
      }`}
    />
  )
}

export function ThoughtBubble({
  thoughts,
  isThinking,
}: {
  thoughts: ThoughtStep[]
  isThinking: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    setIsOpen(isThinking)
  }, [isThinking])

  if (thoughts.length === 0) {
    if (!isThinking) return null
    return (
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]" />
        <span>Thinking...</span>
      </div>
    )
  }

  const lastThought = thoughts[thoughts.length - 1]
  const totalSteps = lastThought.totalSteps

  const headerText = isThinking
    ? totalSteps
      ? `Thinking... step ${lastThought.step}/${totalSteps}`
      : 'Thinking...'
    : `Thought for ${thoughts.length} step${thoughts.length === 1 ? '' : 's'}`

  return (
    <div className="text-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
          {isThinking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          )}
          <span>{headerText}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 ml-[7px] border-l border-gray-200 dark:border-gray-700 pl-3">
          <div className="space-y-1">
            {thoughts.map((thought, index) => {
              const isLast = index === thoughts.length - 1
              const isActive = isLast && isThinking
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-0.5 text-xs transition-opacity duration-300 ${
                    isActive
                      ? 'text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <StepIcon phase={thought.phase} isActive={isActive} />
                  <span>{thought.body}</span>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
