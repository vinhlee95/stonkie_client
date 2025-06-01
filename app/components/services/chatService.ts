const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export const chatService = {
  async analyzeQuestion(question: string, ticker: string | undefined, signal?: AbortSignal) {
    const response = await fetch(`${BACKEND_URL}/api/company/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, ticker }),
      signal,
    });

    if (!response.ok) {
      throw new Error('Failed to get analysis');
    }

    return response.body?.getReader();
  },

  async fetchFAQs(ticker: string | undefined) {
    const URL = ticker 
      ? `${BACKEND_URL}/api/company/faq?ticker=${ticker}&stream=true` 
      : `${BACKEND_URL}/api/company/faq?stream=true`;
    
    const response = await fetch(URL);
    return response.body?.getReader();
  },

  async fetchDetailedReport(ticker: string | undefined, slug: string) {
    const response = await fetch(`${BACKEND_URL}/api/companies/${ticker}/reports/${slug}`);
    return response.body?.getReader();
  }
}; 