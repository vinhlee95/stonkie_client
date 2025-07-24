'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FinancialPeriodTab from './FinancialPeriodTab'

export default function FinancialPeriodTabWithRouterChange() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getPeriodFromUrl = useCallback(() => {
    return searchParams.get('period') === 'quarterly' ? 'Quarterly' : 'Annual'
  }, [searchParams])

  const [selectedPeriod, setSelectedPeriod] = useState<'Annual' | 'Quarterly'>(getPeriodFromUrl())

  useEffect(() => {
    setSelectedPeriod(getPeriodFromUrl())
  }, [searchParams, getPeriodFromUrl])

  const handlePeriodChange = (period: 'Annual' | 'Quarterly') => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('period', period.toLowerCase())

    router.push(`?${newSearchParams.toString()}`, { scroll: false })
    // setSelectedPeriod is updated via useEffect listening to searchParams
  }

  return (
    <FinancialPeriodTab
      selectedPeriod={selectedPeriod}
      onPeriodChange={handlePeriodChange}
      // {...props} // Spread any other props if necessary for FinancialPeriodTab
    />
  )
}
