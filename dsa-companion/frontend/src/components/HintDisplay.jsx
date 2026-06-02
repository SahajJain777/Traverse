import React from "react"

export default function HintDisplay({ streamedHint, isStreaming }) {
  if (!streamedHint) return null

  return (
    <div className="py-4 text-[15px] text-[var(--text-primary)] font-normal leading-[1.7] whitespace-pre-wrap">
      {streamedHint}
      {isStreaming && (
        <span className="inline-block w-1 h-4 bg-[var(--text-secondary)] ml-1 animate-pulse" />
      )}
    </div>
  )
}
