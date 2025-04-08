'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';

const TABS = [
  {
    label: 'Income statements',
    path: ''
  },
  {
    label: 'Balance sheet',
    path: '/balance_sheet'
  },
  {
    label: 'Cash flow',
    path: '/cash_flow'
  }
]

export default function Tabs({ticker}: {ticker: string}) {
  const pathname = usePathname();
  
  return (
    <div className="flex space-x-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {TABS.map((tab) => {
        const href = `/tickers/${ticker}/statements${tab.path}`;
        const isActive = tab.path === '' ? pathname === href : pathname.includes(href);
        
        return (
          <Link key={tab.label} href={href}>
            <button
              className={`px-6 py-3 rounded-full font-medium flex-shrink-0 transition-colors duration-200 ${
                isActive 
                  ? 'bg-[var(--tab-active)] dark:bg-[var(--tab-active-dark)] text-white'
                  : 'bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] text-gray-900 dark:text-white hover:bg-[var(--button-hover)] dark:hover:bg-[var(--button-hover-dark)]'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        );
      })}
    </div>
  );
}