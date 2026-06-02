import React from "react"
import { APPROACH_DIRECTIONS } from "../constants"

export default function AnalysisBar({ direction, encouragement }) {
  const dirConfig = APPROACH_DIRECTIONS[direction] || {
    label: direction || "",
    color: "var(--text-secondary)",
  }

  return (
    <div className="flex flex-col gap-1 py-1.5 border-b border-[var(--border-default)]">
      <div className="flex items-center gap-2">
        <span
          style={{ color: dirConfig.color }}
          className="text-xs font-semibold uppercase tracking-wider"
        >
          {dirConfig.label}
        </span>
      </div>
      {encouragement && (
        <p className="text-xs text-[var(--text-secondary)] font-normal truncate">
          {encouragement}
        </p>
      )}
    </div>
  )
}
