'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FinancialPeriodTabProps {
  onPeriodChange?: (period: 'Annual' | 'Quarterly') => void;
}

export default function FinancialPeriodTab({ onPeriodChange }: FinancialPeriodTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<'Annual' | 'Quarterly'>(
    searchParams.get('period') === 'quarterly' ? 'Quarterly' : 'Annual'
  );

  // Update selected period when URL changes
  useEffect(() => {
    const period = searchParams.get('period') === 'quarterly' ? 'Quarterly' : 'Annual';
    setSelectedPeriod(period);
  }, [searchParams]);

  const handlePeriodChange = (period: 'Annual' | 'Quarterly') => {
    // Create new URLSearchParams
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('period', period.toLowerCase());
    
    // Update URL with new period
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
    
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <div className="flex mb-4">
      <button
        onClick={() => handlePeriodChange('Annual')}
        className={`
          py-2 px-2 mr-4 text-sm font-medium transition-all relative cursor-pointer
          ${
            selectedPeriod === 'Annual'
              ? 'text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--accent-active)] dark:after:bg-[var(--accent-active-dark)]'
              : 'text-gray-700 dark:text-gray-300 hover:text-[var(--accent-hover)] dark:hover:text-[var(--accent-hover-dark)]'
          }
        `}
      >
        Annual
      </button>
      <button
        onClick={() => handlePeriodChange('Quarterly')}
        className={`
          py-2 px-2 text-sm font-medium transition-all relative cursor-pointer
          ${
            selectedPeriod === 'Quarterly'
              ? 'text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--accent-active)] dark:after:bg-[var(--accent-active-dark)]'
              : 'text-gray-700 dark:text-gray-300 hover:text-[var(--accent-hover)] dark:hover:text-[var(--accent-hover-dark)]'
          }
        `}
      >
        Quarterly
      </button>
    </div>
  );
}
