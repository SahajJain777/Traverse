import React, { useMemo } from "react"

// Regex to match 【CODE】...【/CODE】 or [CODE]...[/CODE] segments
const codeBlockRegex = /[【\[]CODE[】\]]([\s\S]*?)[【\[]\/CODE[】\]]/g

function renderSegments(text) {
  const segments = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Push text before this code block
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      })
    }
    // Push the code block
    segments.push({
      type: "code",
      content: match[1],
    })
    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    })
  }

  return segments
}

export default function HintDisplay({ streamedHint, isStreaming }) {
  const segments = useMemo(
    () => (streamedHint ? renderSegments(streamedHint.trimStart()) : []),
    [streamedHint]
  )

  if (segments.length === 0 && !isStreaming) return null
  if (segments.length === 0) {
    return (
      <div className="text-[15px] text-[var(--text-primary)] font-normal leading-[1.7] whitespace-pre-wrap">
        <span className="inline-block w-1 h-4 bg-[var(--text-secondary)] ml-1 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="text-[15px] text-[var(--text-primary)] font-normal leading-[1.7] whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <code
            key={i}
            className="block my-2 px-3 py-2 text-[13px] font-mono leading-[1.5] bg-[#1e1e1e] text-[#d4d4d4] rounded-lg border border-[#333] overflow-x-auto whitespace-pre"
          >
            {seg.content}
          </code>
        ) : (
          <span key={i}>{seg.content}</span>
        )
      )}
      {isStreaming && (
        <span className="inline-block w-1 h-4 bg-[var(--text-secondary)] ml-1 animate-pulse" />
      )}
    </div>
  )
}
