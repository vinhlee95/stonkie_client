import { describe, it, expect } from 'vitest'
import { parseVisualBlocks } from '../utils/parseVisualBlocks'

describe('parseVisualBlocks', () => {
  it('returns empty blocks for empty string', () => {
    const result = parseVisualBlocks('')
    expect(result.blocks).toEqual([])
    expect(result.pendingVisual).toBe(false)
  })

  it('returns single text block for plain text', () => {
    const result = parseVisualBlocks('Hello world\n\nSome more text.')
    expect(result.blocks).toEqual([{ type: 'text', content: 'Hello world\n\nSome more text.' }])
    expect(result.pendingVisual).toBe(false)
  })

  it('parses SVG visual block between text', () => {
    const input =
      'Before text\n\n```svg\n<svg viewBox="0 0 100 100"><circle r="50"/></svg>\n```\n\nAfter text'
    const result = parseVisualBlocks(input)
    expect(result.blocks).toHaveLength(3)
    expect(result.blocks[0]).toEqual({ type: 'text', content: 'Before text\n\n' })
    expect(result.blocks[1]).toEqual({
      type: 'visual',
      lang: 'svg',
      content: '<svg viewBox="0 0 100 100"><circle r="50"/></svg>',
    })
    expect(result.blocks[2]).toEqual({ type: 'text', content: '\n\nAfter text' })
  })

  it('parses HTML visual block between text', () => {
    const input = 'Intro\n\n```html\n<html><body>Hello</body></html>\n```\n\nOutro'
    const result = parseVisualBlocks(input)
    expect(result.blocks).toHaveLength(3)
    expect(result.blocks[1]).toEqual({
      type: 'visual',
      lang: 'html',
      content: '<html><body>Hello</body></html>',
    })
  })

  it('handles multiple visual blocks interspersed with text', () => {
    const input =
      'Text1\n\n```svg\n<svg></svg>\n```\n\nText2\n\n```html\n<div>hi</div>\n```\n\nText3'
    const result = parseVisualBlocks(input)
    expect(result.blocks).toHaveLength(5)
    expect(result.blocks[0].type).toBe('text')
    expect(result.blocks[1]).toEqual({ type: 'visual', lang: 'svg', content: '<svg></svg>' })
    expect(result.blocks[2].type).toBe('text')
    expect(result.blocks[3]).toEqual({ type: 'visual', lang: 'html', content: '<div>hi</div>' })
    expect(result.blocks[4].type).toBe('text')
  })

  it('buffers unclosed fence during streaming', () => {
    const input = 'Some text\n\n```svg\n<svg><rect'
    const result = parseVisualBlocks(input, true)
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0]).toEqual({ type: 'text', content: 'Some text\n\n' })
    expect(result.pendingVisual).toBe(true)
  })

  it('treats unclosed fence as text when not streaming', () => {
    const input = 'Some text\n\n```svg\n<svg><rect'
    const result = parseVisualBlocks(input, false)
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].type).toBe('text')
    expect(result.blocks[0].content).toContain('```svg')
    expect(result.pendingVisual).toBe(false)
  })

  it('drops empty visual blocks', () => {
    const input = 'Before\n\n```svg\n   \n```\n\nAfter'
    const result = parseVisualBlocks(input)
    expect(result.blocks).toHaveLength(2)
    expect(result.blocks.every((b) => b.type === 'text')).toBe(true)
  })

  it('passes non-visual fenced blocks through as text', () => {
    const input = 'Code example:\n\n```python\nprint("hello")\n```\n\nDone'
    const result = parseVisualBlocks(input)
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].type).toBe('text')
    expect(result.blocks[0].content).toContain('```python')
  })

  it('handles visual block at start of content', () => {
    const input = '```svg\n<svg></svg>\n```\n\nAfter'
    const result = parseVisualBlocks(input)
    expect(result.blocks[0]).toEqual({ type: 'visual', lang: 'svg', content: '<svg></svg>' })
    expect(result.blocks[1].type).toBe('text')
  })

  it('handles visual block at end of content', () => {
    const input = 'Before\n\n```html\n<div>chart</div>\n```'
    const result = parseVisualBlocks(input)
    expect(result.blocks[0].type).toBe('text')
    expect(result.blocks[1]).toEqual({
      type: 'visual',
      lang: 'html',
      content: '<div>chart</div>',
    })
  })

  it('handles complete fence followed by unclosed fence during streaming', () => {
    const input = 'Text\n\n```svg\n<svg>done</svg>\n```\n\nMore\n\n```html\n<div>partial'
    const result = parseVisualBlocks(input, true)
    expect(result.blocks).toHaveLength(3)
    expect(result.blocks[0].type).toBe('text')
    expect(result.blocks[1]).toEqual({ type: 'visual', lang: 'svg', content: '<svg>done</svg>' })
    expect(result.blocks[2].type).toBe('text')
    expect(result.pendingVisual).toBe(true)
  })
})
