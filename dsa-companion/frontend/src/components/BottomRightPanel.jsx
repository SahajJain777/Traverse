import React, { useState } from "react"
import VisualSandbox from "./VisualSandbox"
import TabSlider from "./TabSlider"
import { STRINGS } from "../constants"

const TABS = [
  { key: "analysis", label: STRINGS.tabAnalysis },
  { key: "animation", label: STRINGS.tabAnimation },
]

export default function BottomRightPanel({
  analysis,
  studentVisualHtml,
  studentVisualFallback,
  generatingStudentVisual,
  onGenerateStudentVisual,
}) {
  const [activeTab, setActiveTab] = useState("analysis")
  const tabIndex = TABS.findIndex((t) => t.key === activeTab)

  // INPUT state — nothing to show yet
  if (!analysis && !studentVisualHtml && !generatingStudentVisual) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center bg-white border-t border-[var(--border-default)]">
        <p className="text-xs text-[var(--text-muted)] font-normal max-w-xs leading-relaxed">
          {STRINGS.visualPlaceholder}
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-t border-[var(--border-default)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
              activeTab === tab.key
                ? "text-[var(--text-primary)] border-b-2 border-black"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-b-2 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sliding tab content */}
      <div className="flex-1 overflow-hidden">
        <TabSlider activeIndex={tabIndex}>
          <div className="h-full overflow-y-auto p-4">
            <AnalysisContent analysis={analysis} />
          </div>
          <div className="h-full overflow-y-auto p-4">
            <AnimationContentMinimal
              studentVisualHtml={studentVisualHtml}
              studentVisualFallback={studentVisualFallback}
              generatingStudentVisual={generatingStudentVisual}
              onGenerateStudentVisual={onGenerateStudentVisual}
            />
          </div>
        </TabSlider>
      </div>
    </div>
  )
}

function AnalysisContent({ analysis }) {
  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
          Approach analysis will appear here after submission.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Approach direction */}
      <div>
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
          Direction
        </span>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {analysis.approach_direction || "—"}
        </p>
      </div>

      {/* Student intent */}
      <div>
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
          Detected Approach
        </span>
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
          {analysis.student_intent || "—"}
        </p>
      </div>

      {/* Concept gap */}
      {analysis.concept_gap && (
        <div>
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
            Concept Gap
          </span>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            {analysis.concept_gap}
          </p>
        </div>
      )}

      {/* Encouragement */}
      {analysis.encouragement && (
        <div className="pt-2 border-t border-[var(--border-default)]">
          <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
            {analysis.encouragement}
          </p>
        </div>
      )}
    </div>
  )
}

function AnimationContentMinimal({
  studentVisualHtml,
  studentVisualFallback,
  generatingStudentVisual,
  onGenerateStudentVisual,
}) {
  const hasStudentVisual = studentVisualHtml || studentVisualFallback

  return (
    <div className="flex flex-col h-full">
      {/* Generate button */}
      <div className="flex-shrink-0 mb-3">
        <button
          onClick={onGenerateStudentVisual}
          disabled={generatingStudentVisual}
          className="w-full py-2 px-4 bg-black text-xs font-semibold text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingStudentVisual ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            STRINGS.generateMyVisual
          )}
        </button>
      </div>

      {/* Visual sandbox */}
      {(hasStudentVisual || generatingStudentVisual) ? (
        <div className="flex-1 min-h-0">
          <VisualSandbox
            html={studentVisualHtml}
            fallbackText={studentVisualFallback}
            onRegenerate={onGenerateStudentVisual}
            isLoading={generatingStudentVisual}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Click the button above to generate a visual walkthrough of your approach.
          </p>
        </div>
      )}
    </div>
  )
}
