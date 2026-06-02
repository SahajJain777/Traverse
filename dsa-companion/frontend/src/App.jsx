import React, { useState, useEffect, useRef, useCallback } from "react"
import client from "./api/client"
import useSession from "./hooks/useSession"
import useSSE from "./hooks/useSSE"
import { APP_STATES, STRINGS, CELEBRATION_DURATION_MS, COLD_START_THRESHOLD_MS } from "./constants"
import LeftPanel from "./components/LeftPanel"
import TopRightPanel from "./components/TopRightPanel"
import VisualSandbox from "./components/VisualSandbox"
import ComparisonView from "./components/ComparisonView"
import CelebrationOverlay from "./components/CelebrationOverlay"

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

  const coldStartTimer = useRef(null)

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

  // Request hint tier stream
  const handleRequestHint = useCallback((tier) => {
    if (!sessionId) return
    setActiveTier(tier)
    
    // Map tier labels
    const labels = ["Subtle hint", "Method hint", "Step-by-step hint"]
    setLastUsedTier(labels[tier - 1] || "")

    const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/chat/hint?session_id=${sessionId}&tier=${tier}`
    setHintUrl(url)
  }, [sessionId])

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
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[var(--bg-page)] relative text-[var(--text-primary)] font-sans antialiased">
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
          problem={problem}
          setProblem={setProblem}
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
            </div>

            {/* Hints tab */}
            {activeRightTab === "hints" && (
              <TopRightPanel
                appState={appState}
                streamedHint={streamedText}
                isStreaming={isStreaming}
                onRequestHint={handleRequestHint}
                lastUsedTier={lastUsedTier}
                goalReached={goalReached}
                onViewOptimal={handleViewOptimal}
                onNewProblem={handleNewProblem}
              />
            )}

            {/* Animation tab */}
            {activeRightTab === "animation" && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-white">
                {studentVisualHtml || studentVisualFallback || generatingStudentVisual ? (
                  <div className="flex-1">
                    <VisualSandbox
                      html={studentVisualHtml}
                      fallbackText={studentVisualFallback}
                      onRegenerate={handleGenerateStudentVisual}
                      isLoading={generatingStudentVisual}
                      isFullscreen={false}
                      onToggleFullscreen={() => {}}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 h-full">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Generate an interactive algorithm walkthrough for your current approach.
                    </p>
                    <button
                      onClick={handleGenerateStudentVisual}
                      disabled={generatingStudentVisual}
                      className="w-full py-2.5 px-4 bg-black text-xs font-semibold text-white rounded transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs text-[var(--text-muted)] text-center">
                        Click the button above to generate a visual walkthrough of your approach.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
  )
}
