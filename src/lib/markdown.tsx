/**
 * Minimal, safe markdown renderer for chat messages.
 *
 * Supports:
 *  - **bold**, *italic* / _italic_, `code`
 *  - [link text](https://url)
 *  - bullet lists (- item or * item)
 *  - numbered lists (1. item)
 *  - headings (# H1, ## H2, ### H3)
 *  - blockquotes (> ...)
 *  - paragraph breaks on blank lines
 *  - line breaks on single newlines within paragraphs
 *
 * Deliberately tiny — no `dangerouslySetInnerHTML`, everything goes
 * through React so XSS is structurally impossible.
 */

import { Fragment } from 'react'
import type { ReactNode } from 'react'

const URL_RE = /^(https?:\/\/[^\s)]+)/

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let key = 0
  let buf = ''

  function flush() {
    if (buf) {
      nodes.push(<Fragment key={`t-${key++}`}>{buf}</Fragment>)
      buf = ''
    }
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const rest = text.slice(i)

    // Bold **text** or __text__
    let m = rest.match(/^\*\*([^*]+)\*\*/) || rest.match(/^__([^_]+)__/)
    if (m) {
      flush()
      nodes.push(<strong key={`b-${key++}`}>{renderInline(m[1])}</strong>)
      i += m[0].length - 1
      continue
    }

    // Italic *text* or _text_
    m = rest.match(/^\*([^*]+)\*/) || rest.match(/^_([^_]+)_/)
    if (m) {
      flush()
      nodes.push(<em key={`i-${key++}`}>{renderInline(m[1])}</em>)
      i += m[0].length - 1
      continue
    }

    // Inline code `code`
    m = rest.match(/^`([^`]+)`/)
    if (m) {
      flush()
      nodes.push(
        <code key={`c-${key++}`} className="px-1.5 py-0.5 rounded bg-[var(--vn-bg-deep)] font-mono text-[12px]">
          {m[1]}
        </code>,
      )
      i += m[0].length - 1
      continue
    }

    // [text](url)
    m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (m) {
      flush()
      const href = m[2]
      nodes.push(
        <a
          key={`l-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[var(--vn-forest)] hover:text-[var(--vn-forest-dark)]"
        >
          {m[1]}
        </a>,
      )
      i += m[0].length - 1
      continue
    }

    // Auto-link bare URLs
    if (ch === 'h' && URL_RE.test(rest)) {
      const urlMatch = rest.match(URL_RE)!
      const url = urlMatch[1]
      flush()
      nodes.push(
        <a key={`u-${key++}`} href={url} target="_blank" rel="noopener noreferrer" className="underline text-[var(--vn-forest)]">
          {url}
        </a>,
      )
      i += url.length - 1
      continue
    }

    buf += ch
  }
  flush()
  return nodes
}

function isListMarker(line: string): { ordered: boolean; content: string } | null {
  const ul = line.match(/^\s*[-*]\s+(.*)$/)
  if (ul) return { ordered: false, content: ul[1] }
  const ol = line.match(/^\s*\d+\.\s+(.*)$/)
  if (ol) return { ordered: true, content: ol[1] }
  return null
}

export function renderMarkdown(content: string): ReactNode {
  const lines = (content || '').split(/\r?\n/)
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line
    if (!line.trim()) {
      i++
      continue
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const inner = renderInline(h[2])
      if (level === 1)
        blocks.push(<h1 key={`h-${key++}`} className="vn-headline text-[20px] mt-2 mb-1">{inner}</h1>)
      else if (level === 2)
        blocks.push(<h2 key={`h-${key++}`} className="vn-headline text-[17px] mt-2 mb-1">{inner}</h2>)
      else
        blocks.push(<h3 key={`h-${key++}`} className="vn-headline text-[15px] mt-2 mb-1">{inner}</h3>)
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote key={`q-${key++}`} className="border-l-2 border-[var(--vn-forest)] pl-3 my-1 text-[var(--vn-ink-soft)]">
          {renderInline(quoteLines.join('\n'))}
        </blockquote>,
      )
      continue
    }

    // Lists
    const lm = isListMarker(line)
    if (lm) {
      const ordered = lm.ordered
      const items: ReactNode[] = []
      while (i < lines.length) {
        const cur = isListMarker(lines[i])
        if (!cur || cur.ordered !== ordered) break
        items.push(
          <li key={`li-${key++}`} className="ml-5 text-[14.5px] leading-relaxed">
            {renderInline(cur.content)}
          </li>,
        )
        i++
      }
      blocks.push(
        ordered ? (
          <ol key={`ol-${key++}`} className="list-decimal space-y-0.5 my-1">{items}</ol>
        ) : (
          <ul key={`ul-${key++}`} className="list-disc space-y-0.5 my-1">{items}</ul>
        ),
      )
      continue
    }

    // Paragraph (consume contiguous non-empty, non-special lines)
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,3})\s/) && !lines[i].startsWith('>') && !isListMarker(lines[i])) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={`p-${key++}`} className="text-[14.5px] leading-relaxed">
        {para.map((line, idx) => (
          <Fragment key={idx}>
            {renderInline(line)}
            {idx < para.length - 1 && <br />}
          </Fragment>
        ))}
      </p>,
    )
  }

  return <div className="vn-md space-y-1">{blocks}</div>
}
