'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CompanySearch from './CompanySearch'

export default function CompanySearchWrapper() {
  const [ticker, setTicker] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim()) return

    try {
      // Navigate to the ticker page
      router.push(`/tickers/${ticker.toUpperCase()}`)
    } catch (error) {
      console.error('Error navigating to ticker:', error)
    }
  }

  return <CompanySearch ticker={ticker} onTickerChange={setTicker} onSubmit={handleSubmit} />
}
