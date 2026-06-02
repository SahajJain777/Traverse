import React from "react"
import { STRINGS } from "../constants"

export default function VisualSandbox({
  html,
  fallbackText,
  onRegenerate,
  isLoading,
  isFullscreen,
  onToggleFullscreen,
}) {
  return (
    <div className="flex flex-col gap-3 bg-[var(--bg-raised)] p-4 rounded-lg border border-[var(--border-default)]">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Algorithm Visualisation
        </span>
        <div className="flex gap-2">
          {html && !isLoading && (
            <button
              onClick={onToggleFullscreen}
              className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {isFullscreen ? "Show Comparison" : "Full Screen"}
            </button>
          )}
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Generating..." : STRINGS.regenerateVisual}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border-default)] rounded bg-white">
          <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[var(--text-secondary)]">Generating animation...</p>
        </div>
      )}

      {!isLoading && html && (
        <div className="w-full border border-[var(--border-default)] rounded overflow-hidden bg-white shadow-sm">
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            title="Algorithm Visualisation"
            style={{ height: "420px", width: "100%" }}
            className="border-0 block"
          />
        </div>
      )}

      {!isLoading && fallbackText && !html && (
        <div className="p-3 border border-[var(--border-default)] rounded bg-white">
          <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">
            Visualisation Fallback
          </p>
          <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-mono leading-relaxed bg-[var(--bg-hover)] p-2.5 rounded">
            {fallbackText}
          </pre>
        </div>
      )}
    </div>
  )
}
