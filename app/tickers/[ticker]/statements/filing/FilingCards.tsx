'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnnualFiling } from '@/app/types'
import { BarChart3 } from 'lucide-react'
import FilingChatbox from '@/app/components/FilingChatbox'
import { useScrollLock } from '@/app/components/hooks/useScrollLock'

interface FilingCardsProps {
  annualFilings: AnnualFiling[]
  quarterlyFilings: AnnualFiling[]
  selectedPeriod: 'annual' | 'quarterly'
}

export default function FilingCards({
  annualFilings,
  quarterlyFilings,
  selectedPeriod,
}: FilingCardsProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedFiling, setSelectedFiling] = useState<AnnualFiling | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  useScrollLock({ isLocked: isChatOpen, isDesktop })

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768) // md breakpoint
    }

    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)

    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  const handleAnalyzeClick = (filing: AnnualFiling) => {
    setSelectedFiling(filing)
    setIsChatOpen(true)
  }

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const filingName = useMemo(() => {
    if (!selectedFiling) return ''
    return `Form ${selectedPeriod === 'quarterly' ? '10-Q' : '10-K'} ${selectedFiling.period_end_year}`
  }, [selectedPeriod, selectedFiling])

  const filings = selectedPeriod === 'quarterly' ? quarterlyFilings : annualFilings

  return (
    <>
      {/* Filing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filings.map((filing, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-600 rounded-xl p-6"
            style={{ backgroundColor: 'var(--card-background)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Form {selectedPeriod === 'quarterly' ? '10-Q' : '10-K'}{' '}
                  {selectedPeriod === 'quarterly'
                    ? filing.period_end_quarter
                    : filing.period_end_year}
                </h3>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  index === 0
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
                style={index === 0 ? { backgroundColor: 'var(--tab-active)' } : {}}
              >
                {index === 0 ? 'Latest' : 'Complete'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAnalyzeClick(filing)}
                className="button-primary text-sm flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white"
              >
                <BarChart3 size={16} />
                Analyze
              </button>
              <a
                href={filing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary text-sm flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-gray-700 dark:text-gray-200"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Modal */}
      {isChatOpen && selectedFiling && (
        <FilingChatbox
          onClose={handleCloseChat}
          filingName={filingName}
          filingUrl={selectedFiling.url}
          periodEndAt={
            selectedPeriod === 'quarterly' && selectedFiling.period_end_quarter
              ? selectedFiling.period_end_quarter
              : selectedFiling.period_end_year.toString()
          }
          isDesktop={isDesktop}
        />
      )}
    </>
  )
}
