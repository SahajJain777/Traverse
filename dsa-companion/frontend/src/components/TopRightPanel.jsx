import React from "react"
import HintDisplay from "./HintDisplay"
import SocraticChat from "./SocraticChat"
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
  // Hint history props
  hintHistory,
  viewingHistoryIdx,
  onNavigateHistory,
  allHintsExhausted,
  displayHint,
  // Socratic chat props
  socraticMessages,
  isAskingSocratic,
  onAskSocratic,
}) {
  const isInput = appState === APP_STATES.INPUT

  // Show socratic chat when a hint is displayed and not streaming
  const showSocratic = displayHint && !isStreaming

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
        {/* Hint navigation pills */}
        {hintHistory.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[var(--border-default)] overflow-x-auto">
            {hintHistory.map((h, i) => (
              <button
                key={h.tier}
                onClick={() => onNavigateHistory(viewingHistoryIdx === i ? null : i)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                  viewingHistoryIdx === i
                    ? "bg-black text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        )}

        {/* Hint streaming block wrapped in a subtle card */}
        {displayHint ? (
          <div className="bg-white border border-[var(--border-default)] rounded-lg px-4 py-3 shadow-sm">
            <HintDisplay
              streamedHint={displayHint}
              isStreaming={viewingHistoryIdx === null && isStreaming}
            />
            {/* Last used hint label — only show on current hint */}
            {lastUsedTier && !isStreaming && viewingHistoryIdx === null && (
              <p className="text-[11px] text-[var(--text-secondary)] font-normal mt-3 pt-3 border-t border-[var(--border-default)]">
                {STRINGS.lastHintUsed} <span className="font-medium text-[var(--text-primary)]">{lastUsedTier}</span>
              </p>
            )}

            {/* Socratic follow-up chat — only on current hint after streaming */}
            {showSocratic && (
              <SocraticChat
                messages={socraticMessages}
                isAsking={isAskingSocratic}
                onAskQuestion={onAskSocratic}
              />
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

      {/* Single progressive hint button — disabled when all hints used */}
      {!goalReached && (
        <div className="flex-shrink-0 pt-3">
          <button
            onClick={() => {
              // Progress through tiers: 1 → 2 → 3
              const tierMap = { "Subtle hint": 2, "Method hint": 3, "Step-by-step hint": 3 }
              const nextTier = lastUsedTier ? (tierMap[lastUsedTier] || 1) : 1
              onRequestHint(nextTier)
            }}
            disabled={isStreaming || allHintsExhausted}
            className="w-full py-2.5 px-4 bg-black text-xs font-semibold text-white rounded-lg transition-all hover:bg-gray-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isStreaming ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : allHintsExhausted ? (
              <>
                All hints used
              </>
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
