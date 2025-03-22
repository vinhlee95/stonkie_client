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
    <div className="flex p-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`py-2 mr-6 text-lg transition-colors duration-200 ${
              isActive 
                ? 'text-white-600 border-b-2 border-white-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};