import React from "react"
import HintDisplay from "./HintDisplay"
import { APP_STATES, STRINGS } from "../constants"

export default function TopRightPanel({
  appState,
  streamedHint,
  isStreaming,
  onRequestHint,
  lastUsedTier,
  goalReached,
  onViewOptimal,
  onNewProblem,
}) {
  const isInput = appState === APP_STATES.INPUT

  if (isInput) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center bg-white">
        <p className="text-sm text-[var(--text-secondary)] font-normal">
          {STRINGS.inputPlaceholder}
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-raised)] relative p-4">
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Hint streaming block wrapped in a subtle card */}
        {streamedHint ? (
          <div className="bg-white border border-[var(--border-default)] rounded-lg p-4 shadow-sm">
            <HintDisplay
              streamedHint={streamedHint}
              isStreaming={isStreaming}
            />
            {/* Last used hint label */}
            {lastUsedTier && !isStreaming && (
              <p className="text-[11px] text-[var(--text-secondary)] font-normal mt-3 pt-3 border-t border-[var(--border-default)]">
                {STRINGS.lastHintUsed} <span className="font-medium text-[var(--text-primary)]">{lastUsedTier}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs">
              {STRINGS.requestHintPlaceholder}
            </p>
          </div>
        )}
      </div>

      {/* Single progressive hint button */}
      {!goalReached && (
        <div className="flex-shrink-0 pt-3">
          <button
            onClick={() => {
              // Progress through tiers: 1 → 2 → 3, then regenerate the last tier
              const tierMap = { "Subtle hint": 2, "Method hint": 3, "Step-by-step hint": 3 }
              const nextTier = lastUsedTier ? (tierMap[lastUsedTier] || 1) : 1
              onRequestHint(nextTier)
            }}
            disabled={isStreaming}
            className="w-full py-2.5 px-4 bg-black text-xs font-semibold text-white rounded-lg transition-all hover:bg-gray-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isStreaming ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                {lastUsedTier ? STRINGS.nextHint : STRINGS.getHint}
                <span className="text-[10px] opacity-60">→</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Goal reached state */}
      {goalReached && (
        <div className="flex-shrink-0 pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--success-color)] flex items-center gap-1.5">
            {STRINGS.goalReached}
          </span>
          <button
            onClick={onViewOptimal}
            className="text-xs font-semibold text-[var(--text-primary)] hover:underline"
          >
            {STRINGS.seeOptimal}
          </button>
        </div>
      )}
    </div>
  )
}
