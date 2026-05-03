import { describe, it, expect } from 'vitest'
import { processStreamLine, StreamState } from '../utils/processStreamLine'

const SAMPLE_STREAM = `{"type": "conversation", "body": {"conversationId": "0cfacf9d-b869-4aa4-a8cf-44c6c139d418"}}
{"type": "thinking_status", "body": "Classifying your question...", "phase": "classify", "step": 1}
{"type": "thinking_status", "body": "Searching the web for up-to-date data...", "phase": "search", "step": 2}
{"type": "thinking_status", "body": "Determining which financial statements to pull...", "phase": "classify", "step": 3, "total_steps": 6}
{"type": "thinking_status", "body": "Pulling NVDA quarterly reports...", "phase": "data_fetch", "step": 4, "total_steps": 6}
{"type": "attachment_url", "title": "Quarterly 10Q report for the quarter ending on 7/31/2025", "body": "https://www.sec.gov/Archives/edgar/data/1045810/000104581025000209/nvda-20250727.htm"}
{"type": "thinking_status", "body": "Generating analysis...", "phase": "analyze", "step": 5, "total_steps": 6}
{"type": "answer", "body": "N"}
{"type": "answer", "body": "VIDIA's latest quarterly report showcases continued robust financial performance, primarily driven by exceptional"}
{"type": "answer", "body": " growth in its Data Center segment. The company achieved record revenues and demonstrated substantial year"}
{"type": "answer", "body": "-over-year increases, reflecting sustained high demand for its AI-focused computing platforms and chips.\\n\\n**Record Revenue Growth**\\n\\nNVIDIA reported record revenue"}
{"type": "answer", "body": " of **$39.3 billion** for the fourth quarter ended January 26, 2025, marking a significant **78% increase"}
{"type": "answer", "body": "** year-over-year. This growth is largely attributable to the overwhelming demand for its AI accelerators, particularly the Blackwell platform, and strong performance in its Data Center segment, which saw revenue surge to **$35.6 billion**, up"}
{"type": "answer", "body": " **93%** from the prior year. This indicates NVIDIA's continued dominance in powering the AI revolution.\\n"}
{"type": "sources", "body": [{"source_id": "s1", "url": "https://nvidianews.nvidia.com/_gallery/download_pdf/67bf85d73d633281c6875f57/", "title": "", "publisher": "NVIDIA", "published_at": "2025-02-26T12:00:00Z", "is_trusted": true}]}
{"type": "answer", "body": "\\n\\n**Exceptional Profitability**\\n\\nThe company also"}
{"type": "answer", "body": " demonstrated strong profitability, with GAAP earnings per diluted share reaching **$0.89** for the fourth quarter, an **82% increase** compared to the previous year. Similarly, non-GAAP earnings per diluted share saw a **71% rise** to **$0.89**. This expansion in earnings"}
{"type": "answer", "body": ", outpacing revenue growth in percentage terms for some metrics, highlights NVIDIA's operational efficiency and strong pricing power within the high-demand AI hardware market.\\n"}
{"type": "answer", "body": "\\n\\n**Strong Fiscal Year Performance**\\n\\nFor the full fiscal year 2025"}
{"type": "answer", "body": ", NVIDIA achieved record revenue of **$130.5 billion**, a substantial **114% increase** from fiscal year 2024. GAAP earnings per diluted share more than doubled, rising **147%** to **$2.94**. This sustained, high-level growth across the entire"}
{"type": "answer", "body": " year underscores the company's strategic position and consistent execution in capitalizing on the global acceleration of AI adoption across industries.\\n"}
{"type": "sources", "body": [{"source_id": "s2", "url": "https://investor.nvidia.com/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf", "title": "0001045810-25-000230", "publisher": "NVIDIA IR", "published_at": null, "is_trusted": true}, {"source_id": "s3", "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf", "title": "0001045810-25-000230", "publisher": "Q4 CDN", "published_at": null, "is_trusted": true}]}
{"type": "model_used", "body": "google/gemini-2.5-flash-lite:nitro"}
{"type": "related_question", "body": "What specific products or segments are driving the revenue growth?"}
{"type": "related_question", "body": "How does their revenue growth compare to industry peers like AMD?"}
{"type": "related_question", "body": "What are the company's updated capital expenditure plans for the next year?"}`

function replayStream(lines: string[]): StreamState {
  let state: StreamState = {
    accumulatedContent: '',
    thoughts: [],
    relatedQuestions: [],
    conversationId: null,
    modelName: undefined,
    attachment: undefined,
  }
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parsed = JSON.parse(trimmed)
    state = processStreamLine(parsed, state)
  }
  return state
}

describe('processStreamLine', () => {
  const lines = SAMPLE_STREAM.split('\n')

  it('processes the full NVIDIA sample stream', () => {
    const state = replayStream(lines)
    expect(state.conversationId).toBe('0cfacf9d-b869-4aa4-a8cf-44c6c139d418')
    expect(state.modelName).toBe('google/gemini-2.5-flash-lite:nitro')
    expect(state.relatedQuestions).toHaveLength(3)
    expect(state.thoughts).toHaveLength(5)
    expect(state.thoughts[0]).toEqual({
      body: 'Classifying your question...',
      phase: 'classify',
      step: 1,
      totalSteps: undefined,
    })
    expect(state.thoughts[4]).toEqual({
      body: 'Generating analysis...',
      phase: 'analyze',
      step: 5,
      totalSteps: 6,
    })
    expect(state.attachment).toEqual({
      title: 'Quarterly 10Q report for the quarter ending on 7/31/2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581025000209/nvda-20250727.htm',
    })
  })

  it('does not inject v2 sources into accumulated answer content', () => {
    const state = replayStream(lines)
    expect(state.accumulatedContent).not.toContain('nvidianews.nvidia.com')
    expect(state.accumulatedContent).not.toContain('investor.nvidia.com')
    expect(state.accumulatedContent).not.toContain('Q4 CDN')
  })

  it('answer text between sources is preserved', () => {
    const state = replayStream(lines)
    expect(state.accumulatedContent).toContain('**Exceptional Profitability**')
    const profitIdx = state.accumulatedContent.indexOf('Exceptional Profitability')
    const firstSectionIdx = state.accumulatedContent.indexOf('AI revolution.')
    expect(profitIdx).toBeGreaterThan(firstSectionIdx)
  })

  it('sources events without answer deltas leave content untouched', () => {
    let state: StreamState = {
      accumulatedContent: 'some text\n',
      thoughts: [],
      relatedQuestions: [],
      conversationId: null,
      modelName: undefined,
      attachment: undefined,
    }
    state = processStreamLine(
      {
        type: 'sources',
        body: [
          { source_id: 's1', publisher: 'Reuters', url: 'https://example.com' },
          { source_id: 's2', title: 'No URL' },
        ],
      },
      state,
    )
    expect(state.accumulatedContent).toBe('some text\n')
  })

  it('sources with empty body array does not modify content', () => {
    const before = 'unchanged content'
    let state: StreamState = {
      accumulatedContent: before,
      thoughts: [],
      relatedQuestions: [],
      conversationId: null,
      modelName: undefined,
      attachment: undefined,
    }
    state = processStreamLine({ type: 'sources', body: [] }, state)
    expect(state.accumulatedContent).toBe(before)
  })
})
