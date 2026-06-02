import React from "react"

export default function LearningStats({ evalLog = {}, attemptsCount = 0 }) {
  const hintsGiven = evalLog.hints_given || 0
  const tier1 = evalLog.hints_tier1 || 0
  const tier2 = evalLog.hints_tier2 || 0
  const tier3 = evalLog.hints_tier3 || 0

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-default)] bg-[var(--bg-hover)] text-[11px] text-[var(--text-secondary)]">
      <div className="flex gap-4">
        <span>
          Attempts: <span className="font-semibold text-[var(--text-primary)]">{attemptsCount}</span>
        </span>
        <span>
          Total Hints: <span className="font-semibold text-[var(--text-primary)]">{hintsGiven}</span>
        </span>
      </div>
      <div className="flex gap-3">
        <span>
          Subtle: <span className="font-semibold text-[var(--text-primary)]">{tier1}</span>
        </span>
        <span>
          Method: <span className="font-semibold text-[var(--text-primary)]">{tier2}</span>
        </span>
        <span>
          Step-by-step: <span className="font-semibold text-[var(--text-primary)]">{tier3}</span>
        </span>
      </div>
    </div>
  )
}
