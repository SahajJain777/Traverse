import React, { useCallback } from "react"
import CodeEditor from "./CodeEditor"
import { LANGUAGES, STRINGS } from "../constants"

export default function LeftPanel({
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
    if (!attempt.trim() || isLoading) return
    onSubmit("", attempt, language)
  }

  const activeLanguage = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]
  const submitText = isInputState ? "Analyzing..." : "Checking..."

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setAttempt(text)
    } catch {
      // Clipboard read denied or unavailable
    }
  }, [setAttempt])

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full flex flex-col bg-[var(--bg-panel)]"
    >
      {/* Code Workspace — takes full height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
          <label className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {STRINGS.codeLabel}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              disabled={appState === "OPTIMAL"}
              className="text-xs font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded px-2.5 py-1 hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Paste from clipboard"
            >
              Paste
            </button>
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
      </div>

      {/* Flush Submit Button */}
      {showSubmit && (
        <button
          type="submit"
          disabled={!attempt.trim() || isLoading}
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
    </form>
  )
}
