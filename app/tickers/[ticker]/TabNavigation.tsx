'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TabNavigation({ticker}: {ticker: string}) {
  const pathname = usePathname()
  const tabs = [
    { label: 'Overview', path: `/tickers/${ticker}` },
    { label: 'Financial statements', path: `/tickers/${ticker}/statements` },
    { label: 'Revenue', path: `/tickers/${ticker}/revenue` },
  ];

  return (
    <div className="flex p-4 overflow-x-auto whitespace-nowrap">
      {tabs.map((tab) => {
        // statements route has multiple sub-routes
        const isActive = tab.path.includes('statements') ? pathname.includes(tab.path) : pathname === tab.path;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`py-2 mr-4 sm:mr-6 text-lg transition-colors duration-200 ${
              isActive 
                ? 'border-b-2 text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] font-semibold' 
                : 'hover:text-[var(--accent-hover)] dark:hover:text-[var(--accent-hover-dark)] font-medium'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};