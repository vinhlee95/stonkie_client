import { AnswerSource } from './hooks/useChatState'
import SourceChip from './SourceChip'

interface ChatSourceChipsProps {
  sources: AnswerSource[]
}

export default function ChatSourceChips({ sources }: ChatSourceChipsProps) {
  if (sources.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {sources.map((source, index) => (
        <SourceChip key={source.sourceId || source.url || source.title || index} source={source} />
      ))}
    </div>
  )
}
