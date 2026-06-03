import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import client from "./api/client"
import useSession from "./hooks/useSession"
import useSSE from "./hooks/useSSE"
import { APP_STATES, STRINGS, CELEBRATION_DURATION_MS, COLD_START_THRESHOLD_MS } from "./constants"
import LeftPanel from "./components/LeftPanel"
import TopRightPanel from "./components/TopRightPanel"
import VisualSandbox from "./components/VisualSandbox"
import ComparisonView from "./components/ComparisonView"
import CelebrationOverlay from "./components/CelebrationOverlay"
import SyntaxDisplayer from "./components/SyntaxDisplayer"
import TabSlider from "./components/TabSlider"

const RIGHT_TAB_ORDER = ["hints", "animation", "syntax"]

export default function App() {
  const { sessionId, loading: sessionLoading } = useSession()
  const [appState, setAppState] = useState(APP_STATES.INPUT)
  
  // Left Panel States
  const [problem, setProblem] = useState("")
  const [attempt, setAttempt] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("python")

  // Tutor Engine States
  const [analysis, setAnalysis] = useState(null)
  const [goalReached, setGoalReached] = useState(false)
  const [checkingGoal, setCheckingGoal] = useState(false)
  const [lastUsedTier, setLastUsedTier] = useState("")
  const [activeTier, setActiveTier] = useState(null)

  // Right column tab state
  const [activeRightTab, setActiveRightTab] = useState("hints")
  
  // Syntax check state
  const [syntaxResult, setSyntaxResult] = useState(null)
  const [isCheckingSyntax, setIsCheckingSyntax] = useState(false)
  const [syntaxError, setSyntaxError] = useState(null)
  const [optimalData, setOptimalData] = useState(null)
  const [visualHtml, setVisualHtml] = useState(null)
  const [visualFallback, setVisualFallback] = useState(null)
  const [generatingVisual, setGeneratingVisual] = useState(false)
  const [showOptimalOverlay, setShowOptimalOverlay] = useState(false)

  // Student approach visualizer states
  const [studentVisualHtml, setStudentVisualHtml] = useState(null)
  const [studentVisualFallback, setStudentVisualFallback] = useState(null)
  const [generatingStudentVisual, setGeneratingStudentVisual] = useState(false)

  // Status & Timers
  const [submitting, setSubmitting] = useState(false)
  const [coldStart, setColdStart] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // SSE hook for hint streaming
  const [hintUrl, setHintUrl] = useState(null)
  const { streamedText, isStreaming, error: sseError, start: startSSE, reset: resetSSE } = useSSE(hintUrl)

  // Hint history for browsing previous hints
  const [hintHistory, setHintHistory] = useState([]) // { tier, label, text }[]
  const [viewingHistoryIdx, setViewingHistoryIdx] = useState(null) // null = viewing current
  const streamedTextRef = useRef("")

  // Keep ref in sync with streamedText
  streamedTextRef.current = streamedText

  const coldStartTimer = useRef(null)

  const HINT_LABELS = ["Subtle hint", "Method hint", "Step-by-step hint"]

  function clearColdStart() {
    if (coldStartTimer.current) clearTimeout(coldStartTimer.current)
    setColdStart(false)
  }

  function startColdStart() {
    coldStartTimer.current = setTimeout(() => setColdStart(true), COLD_START_THRESHOLD_MS)
  }

  // Handle problem submission (Initial attempt)
  async function handleSubmit(problemText, attemptText, lang) {
    if (!sessionId) return
    setSubmitting(true)
    startColdStart()

    try {
      const res = await client.post("/chat/submit", {
        session_id: sessionId,
        problem: problemText,
        attempt: attemptText,
        language: lang,
      })
      setAnalysis(res.data)
      setSelectedLanguage(lang)
      setAppState(APP_STATES.HINT_LOOP)
      setGoalReached(false)
      setOptimalData(null)
      setVisualHtml(null)
      setVisualFallback(null)
    } catch (err) {
      console.error("Submit failed:", err)
    } finally {
      setSubmitting(false)
      clearColdStart()
    }
  }

  // Save the current completed hint to history before switching to a new one
  const saveCurrentHintToHistory = useCallback(() => {
    const text = streamedTextRef.current
    if (text && activeTier) {
      setHintHistory(prev => {
        if (prev.some(h => h.tier === activeTier)) return prev
        return [...prev, { tier: activeTier, label: HINT_LABELS[activeTier - 1], text }]
      })
    }
  }, [activeTier])

  // Save hint when streaming completes
  useEffect(() => {
    if (!isStreaming && streamedText && activeTier && !hintHistory.some(h => h.tier === activeTier)) {
      setHintHistory(prev => {
        if (prev.some(h => h.tier === activeTier)) return prev
        return [...prev, { tier: activeTier, label: HINT_LABELS[activeTier - 1], text: streamedText }]
      })
    }
  }, [isStreaming])

  // Request hint tier stream
  const handleRequestHint = useCallback((tier) => {
    if (!sessionId) return
    
    // Save current hint to history before starting a new one
    saveCurrentHintToHistory()
    setViewingHistoryIdx(null)
    setActiveTier(tier)
    setLastUsedTier(HINT_LABELS[tier - 1] || "")

    const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/chat/hint?session_id=${sessionId}&tier=${tier}`
    setHintUrl(url)
  }, [sessionId, saveCurrentHintToHistory])

  // Navigate history
  const handleNavigateHistory = useCallback((idx) => {
    setViewingHistoryIdx(idx)
  }, [])

  // All 3 hints exhausted?
  const allHintsExhausted = useMemo(
    () => hintHistory.some(h => h.tier === 3) && !isStreaming,
    [hintHistory, isStreaming]
  )

  // Determine which hint text to show
  const displayHint = useMemo(() => {
    if (viewingHistoryIdx !== null && hintHistory[viewingHistoryIdx]) {
      return hintHistory[viewingHistoryIdx].text
    }
    return streamedText
  }, [viewingHistoryIdx, hintHistory, streamedText])

  useEffect(() => {
    if (hintUrl) {
      resetSSE()
      startSSE()
    }
  }, [hintUrl, resetSSE, startSSE])

  // View optimal solution comparison
  const handleViewOptimal = useCallback(async () => {
    if (!sessionId) return
    startColdStart()

    try {
      const res = await client.post("/chat/optimal", {
        session_id: sessionId,
      })
      setOptimalData(res.data)
      setShowOptimalOverlay(true)
      setAppState(APP_STATES.OPTIMAL)
    } catch (err) {
      console.error("Optimal fetch failed:", err)
    } finally {
      clearColdStart()
    }
  }, [sessionId])

  // Close the optimal comparison overlay
  const handleCloseOptimalOverlay = useCallback(() => {
    setShowOptimalOverlay(false)
    setAppState(APP_STATES.HINT_LOOP)
  }, [])

  // Check goal reached (Evaluation submission)
  async function handleCheckGoal() {
    if (!sessionId || checkingGoal) return
    setCheckingGoal(true)
    startColdStart()

    try {
      // First save the latest workspace attempt code in session history
      await client.post("/chat/submit", {
        session_id: sessionId,
        attempt: attempt,
        language: selectedLanguage,
      })

      // Query goal check evaluation
      const res = await client.post("/chat/check-goal", {
        session_id: sessionId,
      })

      const isReached = res.data.goal_reached
      setGoalReached(isReached)

      if (isReached) {
        // Trigger ribbon overlay animation
        setShowCelebration(true)

        // Cascade automatic transitions
        setTimeout(() => {
          setShowCelebration(false)
          handleViewOptimal()
        }, CELEBRATION_DURATION_MS)
      } else {
        // Refresh hints loops by pulling updated approach analysis
        const sessionRes = await client.get(`/session/${sessionId}`)
        if (sessionRes.data.latest_analysis) {
          setAnalysis(sessionRes.data.latest_analysis)
        }
      }
    } catch (err) {
      console.error("Check solution failed:", err)
    } finally {
      setCheckingGoal(false)
      clearColdStart()
    }
  }

  // Generate interactive algorithm visualizer for optimal solution
  async function handleGenerateVisual() {
    if (!sessionId || !optimalData) return
    setGeneratingVisual(true)
    setVisualHtml(null)
    setVisualFallback(null)

    try {
      const res = await client.post("/chat/visual/generate", {
        session_id: sessionId,
        algorithm_name: optimalData.optimal_approach_name,
      })
      if (res.data.html) {
        setVisualHtml(res.data.html)
      } else if (res.data.fallback_text) {
        setVisualFallback(res.data.fallback_text)
      }
    } catch (err) {
      console.error("Visual generation failed:", err)
      setVisualFallback("Could not generate visualisation. Please try again.")
    } finally {
      setGeneratingVisual(false)
    }
  }

  // Generate interactive algorithm visualizer for student's current approach
  async function handleGenerateStudentVisual() {
    if (!sessionId || !analysis) return
    setGeneratingStudentVisual(true)
    setStudentVisualHtml(null)
    setStudentVisualFallback(null)

    const algorithmName = analysis.student_intent || "the current approach"

    try {
      const res = await client.post("/chat/visual/generate", {
        session_id: sessionId,
        algorithm_name: algorithmName,
      })
      if (res.data.html) {
        setStudentVisualHtml(res.data.html)
      } else if (res.data.fallback_text) {
        setStudentVisualFallback(res.data.fallback_text)
      }
    } catch (err) {
      console.error("Student visual generation failed:", err)
      setStudentVisualFallback("Could not generate visualisation. Please try again.")
    } finally {
      setGeneratingStudentVisual(false)
    }
  }

  // Socratic chat state
  const [socraticMessages, setSocraticMessages] = useState([])
  const [isAskingSocratic, setIsAskingSocratic] = useState(false)

  // Handle Socratic follow-up question
  const handleAskSocratic = useCallback(async (question) => {
    if (!sessionId || !streamedTextRef.current) return
    setIsAskingSocratic(true)

    // Optimistically add the user message
    setSocraticMessages(prev => [...prev, { role: "user", content: question }])

    try {
      const res = await client.post("/chat/socratic", {
        session_id: sessionId,
        last_hint: streamedTextRef.current,
        question,
      })
      setSocraticMessages(prev => [...prev, { role: "model", content: res.data.response }])
    } catch (err) {
      console.error("Socratic chat failed:", err)
      setSocraticMessages(prev => [...prev, {
        role: "model",
        content: "Sorry, I couldn't process that. Please try again."
      }])
    } finally {
      setIsAskingSocratic(false)
    }
  }, [sessionId])

  // Clear socratic messages when hint changes
  useEffect(() => {
    setSocraticMessages([])
  }, [activeTier])

  // Check syntax handler
  const handleCheckSyntax = useCallback(async () => {
    if (!sessionId || !attempt.trim()) return
    setIsCheckingSyntax(true)
    setSyntaxError(null)
    setSyntaxResult(null)

    try {
      const res = await client.post("/chat/check-syntax", {
        session_id: sessionId,
        problem: problem,
        code: attempt,
        language: selectedLanguage,
      })
      setSyntaxResult(res.data)
    } catch (err) {
      console.error("Syntax check failed:", err)
      const msg = err.response?.data?.detail || "Syntax check failed. Please try again."
      setSyntaxError(msg)
    } finally {
      setIsCheckingSyntax(false)
    }
  }, [sessionId, attempt, problem, selectedLanguage])

  // In-memory "+ New problem" reset sequence
  async function handleNewProblem() {
    startColdStart()
    try {
      // Fetch fresh session ID
      const res = await client.post("/session/create")
      const { session_id } = res.data
      localStorage.setItem("dsa_session_id", session_id)
      
      // Reset state and views completely in-memory
      setProblem("")
      setAttempt("")
      setAnalysis(null)
      setGoalReached(false)
      setOptimalData(null)
      setVisualHtml(null)
      setVisualFallback(null)
      setShowOptimalOverlay(false)
      setStudentVisualHtml(null)
      setStudentVisualFallback(null)
      setGeneratingStudentVisual(false)
      setLastUsedTier("")
      setActiveTier(null)
      resetSSE()
      setHintUrl(null)
      
      // Reset hint history
      setHintHistory([])
      setViewingHistoryIdx(null)
      
      // Reset socratic chat
      setSocraticMessages([])
      setIsAskingSocratic(false)
      
      // Reset syntax check state
      setSyntaxResult(null)
      setSyntaxError(null)
      
      // Also resets the right-column tab
      setActiveRightTab("hints")
      
      // Reload session bindings
      window.location.reload()
    } catch (err) {
      console.error("Failed to reset session:", err)
    } finally {
      clearColdStart()
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <span className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[var(--text-secondary)] font-normal">Initialising workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-page)] relative text-[var(--text-primary)] font-sans antialiased">

      {/* Top header — Traverse branding */}
      <div className="flex-shrink-0 w-full flex items-center px-4 py-2 border-b border-[var(--border-default)] bg-white">
        <span className="text-sm font-bold tracking-wider uppercase">Traverse</span>
      </div>

      {/* Main content area — left and right columns */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Celebration Portal */}
      <CelebrationOverlay show={showCelebration} />

      {/* Cold start booting alert */}
      {coldStart && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-black text-white px-4 py-2 text-center text-xs font-medium tracking-wide">
          {STRINGS.coldStartBanner}
        </div>
      )}

      {/* Left Panel - Workspace Area (50%) */}
      <div className="w-full md:w-1/2 h-full flex flex-col border-r border-[var(--border-default)]">
        <LeftPanel
          attempt={attempt}
          setAttempt={setAttempt}
          language={selectedLanguage}
          setLanguage={setSelectedLanguage}
          onSubmit={appState === APP_STATES.INPUT ? handleSubmit : handleCheckGoal}
          isLoading={submitting || checkingGoal}
          appState={appState}
        />
      </div>

      {/* Right Column — Entirely tabbed between Hints & Animation */}
      <div className="w-full md:w-1/2 h-full flex flex-col bg-[var(--bg-raised)] relative">
        {showOptimalOverlay && optimalData ? (
          /* Optimal comparison overlay — takes over the entire right column */
          <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-y-auto">
            {/* Close bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-[var(--border-default)] px-4 py-2.5 flex items-center justify-between">
              <button
                onClick={handleCloseOptimalOverlay}
                className="text-xs font-semibold text-[var(--text-primary)] hover:underline flex items-center gap-1"
              >
                ← {STRINGS.closeOptimal}
              </button>
            </div>
            {/* Full-height comparison */}
            <ComparisonView
              attempt={attempt}
              selectedLanguage={selectedLanguage}
              optimalData={optimalData}
              visualHtml={visualHtml}
              visualFallback={visualFallback}
              generatingVisual={generatingVisual}
              onGenerateVisual={handleGenerateVisual}
            />
          </div>
        ) : appState === APP_STATES.INPUT ? (
          /* No hints yet — show placeholder */
          <div className="h-full flex items-center justify-center p-6 text-center bg-white">
            <p className="text-sm text-[var(--text-secondary)] font-normal">
              {STRINGS.inputPlaceholder}
            </p>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex-shrink-0 flex border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
              <button
                onClick={() => setActiveRightTab("hints")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                  activeRightTab === "hints"
                    ? "text-[var(--text-primary)] border-b-2 border-black bg-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-b-2 border-transparent bg-transparent"
                }`}
              >
                {STRINGS.tabHints}
              </button>
              <button
                onClick={() => setActiveRightTab("animation")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                  activeRightTab === "animation"
                    ? "text-[var(--text-primary)] border-b-2 border-black bg-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-b-2 border-transparent bg-transparent"
                }`}
              >
                {STRINGS.tabAnimation}
              </button>
              <button
                onClick={() => setActiveRightTab("syntax")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                  activeRightTab === "syntax"
                    ? "text-[var(--text-primary)] border-b-2 border-black bg-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-b-2 border-transparent bg-transparent"
                }`}
              >
                {STRINGS.tabSyntax}
              </button>
            </div>

            {/* Sliding tab content */}
            <div className="flex-1 overflow-hidden">
              <TabSlider activeIndex={RIGHT_TAB_ORDER.indexOf(activeRightTab)}>
                {/* Hints tab */}
                <div className="h-full overflow-y-auto">
                  <TopRightPanel
                    appState={appState}
                    streamedHint={streamedText}
                    isStreaming={isStreaming}
                    onRequestHint={handleRequestHint}
                    lastUsedTier={lastUsedTier}
                    goalReached={goalReached}
                    onViewOptimal={handleViewOptimal}
                    onNewProblem={handleNewProblem}
                    hintHistory={hintHistory}
                    viewingHistoryIdx={viewingHistoryIdx}
                    onNavigateHistory={handleNavigateHistory}
                    allHintsExhausted={allHintsExhausted}
                    displayHint={displayHint}
                    socraticMessages={socraticMessages}
                    isAskingSocratic={isAskingSocratic}
                    onAskSocratic={handleAskSocratic}
                  />
                </div>

                {/* Animation tab */}
                <div className="h-full p-4 bg-white flex flex-col">
                  {studentVisualHtml || studentVisualFallback || generatingStudentVisual ? (
                    <div className="flex-1 min-h-0">
                      <VisualSandbox
                        html={studentVisualHtml}
                        fallbackText={studentVisualFallback}
                        onRegenerate={handleGenerateStudentVisual}
                        isLoading={generatingStudentVisual}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <p className="text-xs text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
                        Generate an interactive algorithm walkthrough for your current approach.
                      </p>
                      <button
                        onClick={handleGenerateStudentVisual}
                        className="py-2 px-4 bg-black text-xs font-semibold text-white rounded hover:bg-gray-800 transition-colors"
                      >
                        {STRINGS.generateMyVisual}
                      </button>
                    </div>
                  )}
                </div>

                {/* Learn Syntax tab */}
                <div className="h-full overflow-y-auto p-4 bg-white">
                  <SyntaxDisplayer
                    syntaxResult={syntaxResult}
                    isChecking={isCheckingSyntax}
                    onCheckSyntax={handleCheckSyntax}
                    error={syntaxError}
                  />
                </div>
              </TabSlider>
            </div>

            {/* Bottom bar with View Optimal button — always visible */}
            <div className="flex-shrink-0 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3">
              <button
                onClick={handleViewOptimal}
                className="w-full py-2.5 px-4 bg-black text-xs font-semibold text-white rounded transition-colors hover:bg-gray-800 hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                {STRINGS.viewOptimalBtn}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
