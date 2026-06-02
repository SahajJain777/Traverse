import React from "react"
import ComplexityBadge from "./ComplexityBadge"
import VisualSandbox from "./VisualSandbox"
import { STRINGS } from "../constants"

const LANGUAGE_NAMES = {
  python: "Python",
  java: "Java",
  cpp: "C++",
}

export default function ComparisonView({
  attempt,
  selectedLanguage,
  optimalData,
  visualHtml,
  visualFallback,
  generatingVisual,
  onGenerateVisual,
}) {
  if (!optimalData) return null

  const langLabel = LANGUAGE_NAMES[selectedLanguage] || selectedLanguage || "Python"
  const optimalCode = optimalData.optimal_code || ""
  const studentComplexity = optimalData.complexity_of_student_approach || "N/A"
  const optimalName = optimalData.optimal_approach_name || "Optimal Approach"

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--border-default)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Optimal Solution Comparison
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Side-by-side Code Comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* Student's Code */}
          <div className="flex flex-col border border-[var(--border-default)] rounded overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover)] border-b border-[var(--border-default)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {STRINGS.studentCode}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{langLabel}</span>
            </div>
            <div className="bg-[#fafaf8] p-3 overflow-x-auto">
              <pre className="text-[11px] font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {attempt || "// No code written yet"}
              </pre>
            </div>
          </div>

          {/* Optimal Code */}
          <div className="flex flex-col border border-[var(--border-default)] rounded overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover)] border-b border-[var(--border-default)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider truncate">
                {optimalName}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{langLabel}</span>
            </div>
            <div className="bg-[#fafaf8] p-3 overflow-x-auto">
              {optimalCode ? (
                <pre className="text-[11px] font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {optimalCode}
                </pre>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)] italic">
                  Optimal code will appear after generation.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Complexity + Insight Summary */}
        <div className="grid grid-cols-2 gap-3">
          {/* Student Complexity */}
          <div className="flex flex-col gap-1.5 p-3 border border-[var(--border-default)] rounded bg-white">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {STRINGS.complexityStudent}
            </span>
            <ComplexityBadge complexity={studentComplexity} isBetter={false} />
            {optimalData.key_insight && (
              <div className="mt-1">
                <p className="text-[11px] text-[var(--text-primary)] leading-relaxed">
                  {optimalData.key_insight}
                </p>
              </div>
            )}
          </div>

          {/* Optimal Complexity */}
          <div className="flex flex-col gap-1.5 p-3 border border-[var(--border-default)] rounded bg-white">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {STRINGS.complexityOptimal}
            </span>
            <ComplexityBadge complexity={optimalData.optimal_complexity || "—"} isBetter={true} />
            {optimalData.why_it_is_better && (
              <div className="mt-1">
                <p className="text-[11px] text-[var(--text-primary)] leading-relaxed">
                  {optimalData.why_it_is_better}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Visual + Visual Sandbox */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onGenerateVisual}
            disabled={generatingVisual}
            className="w-full py-2.5 px-4 bg-white text-xs font-semibold text-[var(--text-primary)] border border-black rounded transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingVisual ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Generating walkthrough...
              </span>
            ) : (
              STRINGS.generateVisual
            )}
          </button>

          {/* Visual sandbox for optimal solution */}
          {(visualHtml || visualFallback || generatingVisual) && (
            <VisualSandbox
              html={visualHtml}
              fallbackText={visualFallback}
              onRegenerate={onGenerateVisual}
              isLoading={generatingVisual}
              isFullscreen={false}
              onToggleFullscreen={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}
