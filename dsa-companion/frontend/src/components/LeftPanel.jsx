import React from "react"
import CodeEditor from "./CodeEditor"
import { LANGUAGES, STRINGS } from "../constants"

export default function LeftPanel({
  problem,
  setProblem,
  attempt,
  setAttempt,
  language,
  setLanguage,
  onSubmit,
  isLoading,
  appState,
}) {
  const isInputState = appState === "INPUT"
  const isHintLoop = appState === "HINT_LOOP"
  const showSubmit = isInputState || isHintLoop

  function handleSubmit(e) {
    e.preventDefault()
    if (isInputState && !problem.trim()) return
    if (!attempt.trim() || isLoading) return
    onSubmit(problem, attempt, language)
  }

  const activeLanguage = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]
  const submitText = isInputState ? "Analyzing..." : "Checking..."

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full flex flex-col bg-[var(--bg-panel)]"
    >
      {/* Top 35%: Problem Textarea */}
      <div className="h-[35%] flex flex-col p-4 border-b border-[var(--border-default)] relative bg-[var(--bg-raised)]">
        <label className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          {STRINGS.problemLabel}
        </label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          disabled={!isInputState}
          placeholder="Paste or type your problem statement here..."
          className="flex-1 w-full text-sm text-[var(--text-primary)] bg-transparent resize-none border-0 focus:ring-0 focus:outline-none placeholder-[var(--text-muted)] leading-relaxed"
        />
      </div>

      {/* Bottom 65%: Code Workspace */}
      <div className="h-[65%] flex flex-col relative overflow-hidden">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
          <label className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {STRINGS.codeLabel}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={appState === "OPTIMAL"}
            className="text-xs bg-white text-[var(--text-primary)] border border-[var(--border-default)] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monaco Editor (Flush) */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={attempt}
            onChange={setAttempt}
            language={activeLanguage.monacoLang}
            readOnly={appState === "OPTIMAL"}
          />
        </div>

        {/* Flush Submit Button */}
        {showSubmit && (
          <button
            type="submit"
            disabled={(isInputState && !problem.trim()) || !attempt.trim() || isLoading}
            className="w-full py-3 bg-[var(--bg-subtle)] text-xs font-semibold text-black border-t border-black hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest uppercase"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {submitText}
              </span>
            ) : (
              isInputState ? STRINGS.submitButton : STRINGS.checkSolution
            )}
          </button>
        )}
      </div>
    </form>
  )
}
