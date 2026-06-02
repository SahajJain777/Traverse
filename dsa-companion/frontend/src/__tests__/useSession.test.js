import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useSession from '../hooks/useSession'

// We'll mock the axios client module
vi.mock('../api/client', () => {
  const mockClient = {
    post: vi.fn(),
    get: vi.fn(),
  }
  return { default: mockClient }
})

import client from '../api/client'

const SESSION_KEY = 'dsa_session_id'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── No existing session ──────────────────────────────────────────────

it('creates a new session when none exists in localStorage', async () => {
  client.post.mockResolvedValueOnce({ data: { session_id: 'fresh-id' } })

  const { result } = renderHook(() => useSession())

  // Initially loading
  expect(result.current.loading).toBe(true)

  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(client.post).toHaveBeenCalledWith('/session/create')
  expect(result.current.sessionId).toBe('fresh-id')
  expect(localStorage.getItem(SESSION_KEY)).toBe('fresh-id')
})

// ── Existing session in localStorage ─────────────────────────────────

it('loads existing session from localStorage', async () => {
  localStorage.setItem(SESSION_KEY, 'existing-id')
  client.get.mockResolvedValueOnce({
    data: { session_id: 'existing-id', problem: 'Two Sum', attempts: [] },
  })

  const { result } = renderHook(() => useSession())

  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(client.get).toHaveBeenCalledWith('/session/existing-id')
  expect(result.current.sessionId).toBe('existing-id')
  expect(result.current.sessionState).toEqual({
    session_id: 'existing-id',
    problem: 'Two Sum',
    attempts: [],
  })
})

// ── 404 on existing session creates new ──────────────────────────────

it('creates a new session when stored session returns 404', async () => {
  localStorage.setItem(SESSION_KEY, 'stale-id')

  // First try: 404
  client.get.mockRejectedValueOnce({
    response: { status: 404 },
  })
  // Then creates a new one
  client.post.mockResolvedValueOnce({ data: { session_id: 'fresh-id' } })
  // fetchSession is also called for the fresh-id — stub it
  client.get.mockResolvedValueOnce({
    data: { session_id: 'fresh-id' },
  })

  const { result } = renderHook(() => useSession())

  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(result.current.sessionId).toBe('fresh-id')
  expect(localStorage.getItem(SESSION_KEY)).toBe('fresh-id')
})

// ── refreshSession ───────────────────────────────────────────────────

it('refreshSession fetches the session again', async () => {
  localStorage.setItem(SESSION_KEY, 'my-id')
  client.get.mockResolvedValueOnce({
    data: { session_id: 'my-id', problem: 'Initial' },
  })

  const { result } = renderHook(() => useSession())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })
  expect(result.current.sessionState?.problem).toBe('Initial')

  // Now refresh with updated data
  client.get.mockResolvedValueOnce({
    data: { session_id: 'my-id', problem: 'Updated' },
  })

  await result.current.refreshSession()

  expect(client.get).toHaveBeenCalledTimes(2)
  await waitFor(() => {
    expect(result.current.sessionState?.problem).toBe('Updated')
  })
})

// ── Non-404 errors are caught silently ───────────────────────────────

it('handles non-404 fetch errors gracefully', async () => {
  localStorage.setItem(SESSION_KEY, 'my-id')
  client.get.mockRejectedValueOnce(new Error('Network error'))

  const { result } = renderHook(() => useSession())

  await waitFor(() => expect(result.current.loading).toBe(false))

  // Should still have the sessionId even if fetch failed
  expect(result.current.sessionId).toBe('my-id')
  expect(result.current.sessionState).toBeNull()
})
