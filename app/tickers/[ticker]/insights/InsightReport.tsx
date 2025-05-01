'use client'
import { chatService } from "@/app/components/services/chatService";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';

export default function InsightReport({ticker, slug}: {ticker: string, slug: string}) {
  const [content, setContent] = useState<string>('');
  const hasFetchedDetailedReport = useRef(false);   

  const fetchDetailedReport = async (slug: string) => {
    try {
      const reader = await chatService.fetchDetailedReport(ticker, slug);
      if (!reader) throw new Error('Failed to get reader');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          const jsonStrings = chunk.split('\n').filter(str => str.trim());
          for (const jsonStr of jsonStrings) {
            const parsedChunk = JSON.parse(jsonStr);
            accumulatedContent += parsedChunk || '';
            setContent(accumulatedContent);
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed report:', error);
    }
  };

  useEffect(() => {
    if (!hasFetchedDetailedReport.current) {
      hasFetchedDetailedReport.current = true;
      fetchDetailedReport(slug);
    }
  }, [slug]);

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
