import React from "react"

export default function VisualSandbox({
  html,
  fallbackText,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="w-full h-full border border-dashed border-[var(--border-default)] rounded bg-white flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-default)] flex-shrink-0">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Algorithm Visualisation
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[var(--text-secondary)]">Generating animation...</p>
        </div>
      </div>
    )
  }

  if (html) {
    return (
      <div className="w-full h-full border border-[var(--border-default)] rounded overflow-hidden bg-white flex flex-col">
        {/* Slim title bar — matches app design system */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-default)] flex-shrink-0">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Algorithm Visualisation
          </span>
        </div>
        {/* Iframe fills remaining space — no scrolling */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            title="Algorithm Visualisation"
            className="w-full h-full border-0 block"
            scrolling="no"
          />
        </div>
      </div>
    )
  }

  if (fallbackText) {
    return (
      <div className="w-full h-full border border-[var(--border-default)] rounded overflow-hidden bg-white flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-default)] flex-shrink-0">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Algorithm Visualisation
          </span>
        </div>
        <pre className="flex-1 text-xs text-[var(--text-primary)] whitespace-pre-wrap font-mono leading-relaxed bg-[var(--bg-hover)] p-3 m-0 overflow-hidden">
          {fallbackText}
        </pre>
      </div>
    )
  }

  return null
}
