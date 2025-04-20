'use client'
import { useParams } from 'next/navigation'

export default function InsightContent({type}: {type: 'growth' | 'earning' | 'cash_flow'}) {
  const {ticker} = useParams()

  return (
    <div>
      <h1>{type} insights for {ticker}</h1>
    </div>
  )
}