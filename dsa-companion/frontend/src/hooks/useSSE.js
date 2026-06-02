import { useState, useRef, useCallback, useEffect } from "react"

/**
 * useSSE — wraps an EventSource connection for streaming hint text.
 *
 * @param {string} url — SSE endpoint URL
 * @returns {{ streamedText, isStreaming, error, reset, start }}
 */
export default function useSSE(url) {
  const [streamedText, setStreamedText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setStreamedText("")
    setError(null)
  }, [stop])

  const start = useCallback(() => {
    reset()

    const es = new EventSource(url)
    eventSourceRef.current = es
    setIsStreaming(true)
    setError(null)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.done) {
          stop()
          return
        }
        if (data.chunk) {
          setStreamedText((prev) => prev + data.chunk)
        }
      } catch {
        // Non-JSON messages are ignored
      }
    }

    es.onerror = () => {
      setError("Connection lost or stream ended unexpectedly.")
      stop()
    }
  }, [url, reset, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return { streamedText, isStreaming, error, reset, start }
}
