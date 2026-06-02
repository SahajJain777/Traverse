import { useState, useEffect, useCallback } from "react"
import client from "../api/client"

const SESSION_KEY = "dsa_session_id"

export default function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [sessionState, setSessionState] = useState(null)
  const [loading, setLoading] = useState(true)

  const createNewSession = useCallback(async function () {
    try {
      const res = await client.post("/session/create")
      const { session_id } = res.data
      localStorage.setItem(SESSION_KEY, session_id)
      setSessionId(session_id)
      setSessionState(null)
    } catch (err) {
      console.error("Failed to create session:", err)
    }
  }, [])

  const fetchSession = useCallback(async function (id) {
    try {
      const res = await client.get(`/session/${id}`)
      setSessionState(res.data)
    } catch (err) {
      if (err.response && err.response.status === 404) {
        localStorage.removeItem(SESSION_KEY)
        await createNewSession()
      } else {
        console.error("Failed to fetch session:", err)
      }
    }
  }, [createNewSession])

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)

    if (stored) {
      setSessionId(stored)
      fetchSession(stored).finally(() => setLoading(false))
    } else {
      createNewSession().finally(() => setLoading(false))
    }
  }, [fetchSession, createNewSession])

  const refreshSession = useCallback(async () => {
    if (sessionId) {
      await fetchSession(sessionId)
    }
  }, [sessionId, fetchSession])

  return { sessionId, sessionState, loading, refreshSession }
}
