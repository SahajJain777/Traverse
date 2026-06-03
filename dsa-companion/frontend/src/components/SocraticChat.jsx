import React, { useState, useRef, useEffect } from "react"

export default function SocraticChat({
  messages,
  isAsking,
  onAskQuestion,
}) {
  const [question, setQuestion] = useState("")
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input after response arrives
  useEffect(() => {
    if (!isAsking && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAsking])

  function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim() || isAsking) return
    onAskQuestion(question.trim())
    setQuestion("")
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
      <p className="text-[11px] text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider">
        Ask a follow-up
      </p>

      {/* Message history */}
      {messages.length > 0 && (
        <div className="mb-2 space-y-2 max-h-[240px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-[13px] leading-[1.5] ${
                msg.role === "user"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-primary)] bg-[var(--bg-subtle)] pl-2.5 pr-2 py-1.5 rounded -ml-1 border-l-[3px] border-black/20"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1 block mb-0.5">
                {msg.role === "user" ? "You" : "Tutor"}
              </span>
              {msg.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Confused? Ask a follow-up..."
          disabled={isAsking}
          className="flex-1 min-w-0 text-[13px] px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!question.trim() || isAsking}
          className="flex-shrink-0 px-3 py-2 text-[12px] font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAsking ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </span>
          ) : (
            "Ask"
          )}
        </button>
      </form>
    </div>
  )
}
