import { describe, it, expect } from 'vitest'
import { processStreamLine, StreamState } from '../utils/processStreamLine'

const SAMPLE_STREAM = `{"type": "conversation", "body": {"conversationId": "0cfacf9d-b869-4aa4-a8cf-44c6c139d418"}}
{"type": "thinking_status", "body": "Just a moment..."}
{"type": "thinking_status", "body": "Using Google Search to get up-to-date information. This might take a bit longer, but it will help you get a better answer."}
{"type": "thinking_status", "body": "Analyzing question to determine required data..."}
{"type": "thinking_status", "body": "Identifying relevant financial periods..."}
{"type": "thinking_status", "body": "Retrieving quarterly financial data for analysis..."}
{"type": "attachment_url", "title": "Quarterly 10Q report for the quarter ending on 7/31/2025", "body": "https://www.sec.gov/Archives/edgar/data/1045810/000104581025000209/nvda-20250727.htm"}
{"type": "thinking_status", "body": "Analyzing data and preparing insights..."}
{"type": "answer", "body": "N"}
{"type": "answer", "body": "VIDIA's latest quarterly report showcases continued robust financial performance, primarily driven by exceptional"}
{"type": "answer", "body": " growth in its Data Center segment. The company achieved record revenues and demonstrated substantial year"}
{"type": "answer", "body": "-over-year increases, reflecting sustained high demand for its AI-focused computing platforms and chips.\\n\\n**Record Revenue Growth**\\n\\nNVIDIA reported record revenue"}
{"type": "answer", "body": " of **$39.3 billion** for the fourth quarter ended January 26, 2025, marking a significant **78% increase"}
{"type": "answer", "body": "** year-over-year. This growth is largely attributable to the overwhelming demand for its AI accelerators, particularly the Blackwell platform, and strong performance in its Data Center segment, which saw revenue surge to **$35.6 billion**, up"}
{"type": "answer", "body": " **93%** from the prior year. This indicates NVIDIA's continued dominance in powering the AI revolution.\\n"}
{"type": "sources", "body": [{"name": "NVIDIA Announces Financial Results for Fourth Quarter and Fiscal 2025", "url": "https://nvidianews.nvidia.com/_gallery/download_pdf/67bf85d73d633281c6875f57/"}]}
{"type": "answer", "body": "\\n\\n**Exceptional Profitability**\\n\\nThe company also"}
{"type": "answer", "body": " demonstrated strong profitability, with GAAP earnings per diluted share reaching **$0.89** for the fourth quarter, an **82% increase** compared to the previous year. Similarly, non-GAAP earnings per diluted share saw a **71% rise** to **$0.89**. This expansion in earnings"}
{"type": "answer", "body": ", outpacing revenue growth in percentage terms for some metrics, highlights NVIDIA's operational efficiency and strong pricing power within the high-demand AI hardware market.\\n"}
{"type": "answer", "body": "\\n\\n**Strong Fiscal Year Performance**\\n\\nFor the full fiscal year 2025"}
{"type": "answer", "body": ", NVIDIA achieved record revenue of **$130.5 billion**, a substantial **114% increase** from fiscal year 2024. GAAP earnings per diluted share more than doubled, rising **147%** to **$2.94**. This sustained, high-level growth across the entire"}
{"type": "answer", "body": " year underscores the company's strategic position and consistent execution in capitalizing on the global acceleration of AI adoption across industries.\\n"}
{"type": "sources", "body": [{"name": "0001045810-25-000230", "url": "https://investor.nvidia.com/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf"}, {"name": "0001045810-25-000230", "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf"}]}
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
    expect(state.thoughts).toHaveLength(6)
    expect(state.attachment).toEqual({
      title: 'Quarterly 10Q report for the quarter ending on 7/31/2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581025000209/nvda-20250727.htm',
    })
  })

  it('injects first source as inline markdown link after first paragraph', () => {
    const state = replayStream(lines)
    // After "AI revolution.\n" the first source should be injected as a markdown link
    expect(state.accumulatedContent).toContain(
      'AI revolution.\n[NVIDIA Announces Financial Results for Fourth Quarter and Fiscal 2025](https://nvidianews.nvidia.com/_gallery/download_pdf/67bf85d73d633281c6875f57/)',
    )
  })

  it('injects second sources as inline markdown links after last paragraph', () => {
    const state = replayStream(lines)
    // After "across industries.\n" the two sources should be injected
    expect(state.accumulatedContent).toContain(
      'across industries.\n[0001045810-25-000230](https://investor.nvidia.com/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf) [0001045810-25-000230](https://s201.q4cdn.com/141608511/files/doc_financials/2026/q3/13e6981b-95ed-4aac-a602-ebc5865d0590.pdf)',
    )
  })

  it('does not place sources at the very end of content', () => {
    const state = replayStream(lines)
    // Sources should be followed by more answer text (or a newline), not be the last thing
    // The second sources block IS the last answer content, so it ends with a newline
    expect(state.accumulatedContent.trimEnd()).not.toMatch(/\]\)$/)
  })

  it('answer text between sources is preserved', () => {
    const state = replayStream(lines)
    // The "Exceptional Profitability" section should appear between the two source blocks
    expect(state.accumulatedContent).toContain('**Exceptional Profitability**')
    // And it comes after the first source link
    const firstSourceIdx = state.accumulatedContent.indexOf('nvidianews.nvidia.com')
    const profitIdx = state.accumulatedContent.indexOf('Exceptional Profitability')
    expect(profitIdx).toBeGreaterThan(firstSourceIdx)
  })

  it('each source becomes a valid markdown link', () => {
    const state = replayStream(lines)
    // Check that markdown link syntax is correct: [name](url)
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
    const matches = [...state.accumulatedContent.matchAll(linkPattern)]
    // 3 total source links: 1 from first sources event, 2 from second
    expect(matches).toHaveLength(3)
    expect(matches[0][1]).toBe(
      'NVIDIA Announces Financial Results for Fourth Quarter and Fiscal 2025',
    )
    expect(matches[1][1]).toBe('0001045810-25-000230')
    expect(matches[2][1]).toBe('0001045810-25-000230')
  })

  it('sources without url are filtered out', () => {
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
        body: [{ name: 'Has URL', url: 'https://example.com' }, { name: 'No URL' }],
      },
      state,
    )
    expect(state.accumulatedContent).toContain('[Has URL](https://example.com)')
    expect(state.accumulatedContent).not.toContain('No URL')
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
