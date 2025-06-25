"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { InsightType } from "./constants";

interface InsightTypeTabProps {
  currentType: InsightType;
  ticker: string;
}

const typeLabels: Record<InsightType, string> = {
  [InsightType.GROWTH]: "Growth",
  [InsightType.EARNINGS]: "Earnings",
  [InsightType.CASH_FLOW]: "Cash Flow"
};


export default function InsightTypeTab({ currentType, ticker }: InsightTypeTabProps) {
  const router = useRouter();

  const handleTypeChange = (type: InsightType) => {
    if (type !== currentType) {
      router.push(`/tickers/${ticker}/insights/${type}`);
    }
  };

  return (
    <div className="flex space-x-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {Object.values(InsightType).map((type) => {
        const isActive = currentType === type;
        return (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`cursor-pointer px-3 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-medium flex-shrink-0 transition-colors duration-200 ${
              isActive
                ? 'bg-[var(--tab-active)] dark:bg-[var(--tab-active-dark)] text-white'
                : 'bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] text-gray-900 dark:text-white hover:bg-[var(--button-hover)] dark:hover:bg-[var(--button-hover-dark)]'
            }`}
          >
            {typeLabels[type as InsightType]}
          </button>
        );
      })}
    </div>
  );
} 