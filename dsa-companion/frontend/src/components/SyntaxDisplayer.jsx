import React from "react"
import { STRINGS } from "../constants"

export default function SyntaxDisplayer({
  syntaxResult,
  isChecking,
  onCheckSyntax,
  error,
}) {
  // Loading
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Analysing syntax…
        </span>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-xs text-red-600 leading-relaxed text-center">{error}</p>
        <button
          onClick={onCheckSyntax}
          className="py-1.5 px-4 bg-black text-xs font-semibold text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {STRINGS.syntaxCheck}
        </button>
      </div>
    )
  }

  // No errors
  if (syntaxResult && syntaxResult.total_errors === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed text-center">
          <span className="font-medium text-[var(--text-primary)]">✓ {STRINGS.syntaxNoErrors}</span>
          {syntaxResult.code_quality_notes && (
            <p className="mt-2 text-[var(--text-muted)]">{syntaxResult.code_quality_notes}</p>
          )}
        </div>
        <button
          onClick={onCheckSyntax}
          className="py-1.5 px-4 bg-black text-xs font-semibold text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {STRINGS.syntaxCheck}
        </button>
      </div>
    )
  }

  // Errors found
  if (syntaxResult && syntaxResult.total_errors > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-3">
          <button
            onClick={onCheckSyntax}
            className="w-full py-1.5 px-4 bg-black text-xs font-semibold text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {STRINGS.syntaxCheck}
          </button>
        </div>
        <div className="text-sm leading-relaxed flex-1 overflow-y-auto">
          {/* One-line summary */}
          <p className="text-xs text-red-600 font-medium mb-4">
            {syntaxResult.total_errors} {STRINGS.syntaxTotalErrors}
          </p>

          {/* Error list — minimal, inline */}
          <div className="space-y-5">
            {syntaxResult.syntax_errors.map((err, idx) => (
              <div key={idx}>
                {/* Line reference */}
                <p className="text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  {idx + 1}. Line {err.line_number}
                </p>

                {/* Wrong code */}
                <pre className="text-[12px] font-mono text-red-600 whitespace-pre-wrap mb-0.5">
                  {err.wrong_code}
                </pre>

                {/* Corrected code */}
                <pre className="text-[12px] font-mono text-green-600 whitespace-pre-wrap mb-1">
                  {err.correct_code}
                </pre>

                {/* Explanation */}
                {err.explanation && (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {err.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Code quality notes */}
          {syntaxResult.code_quality_notes && (
            <p className="text-xs text-[var(--text-muted)] mt-5 pt-3 border-t border-[var(--border-default)]">
              {syntaxResult.code_quality_notes}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Idle — no results yet, prompt to check
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p className="text-xs text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
        {STRINGS.syntaxCheckPlaceholder}
      </p>
      <button
        onClick={onCheckSyntax}
        className="py-1.5 px-4 bg-black text-xs font-semibold text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        {STRINGS.syntaxCheck}
      </button>
    </div>
  )
}
