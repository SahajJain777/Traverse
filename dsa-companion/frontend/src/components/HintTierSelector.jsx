import React from "react"
import { HINT_TIERS, STRINGS } from "../constants"

export default function HintTierSelector({ onSelect, isLoading, lastUsedTier, activeTier }) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-[var(--border-default)]">
      <div className="flex gap-2">
        {HINT_TIERS.map((hint) => {
          const isActive = activeTier === hint.tier && isLoading
          const btnClasses = isActive
            ? "bg-[#111111] text-white border-[#111111]"
            : "bg-white text-[#111111] border-[var(--border-default)] hover:bg-[var(--bg-hover)]"

          return (
            <button
              key={hint.tier}
              onClick={() => onSelect(hint.tier)}
              disabled={isLoading}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded text-[13px] font-medium transition-colors duration-150
                disabled:cursor-not-allowed
                ${btnClasses}
              `}
            >
              {hint.label}
              {isActive && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          )
        })}
      </div>
      {lastUsedTier && (
        <p className="text-[11px] text-[var(--text-secondary)] font-normal">
          {STRINGS.lastHintUsed} <span className="font-medium text-[var(--text-primary)]">{lastUsedTier}</span>
        </p>
      )}
    </div>
  )
}
