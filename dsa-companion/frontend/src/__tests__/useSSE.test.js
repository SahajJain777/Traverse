import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useSSE from '../hooks/useSSE'

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url
    this.readyState = 0 // CONNECTING
    this.onmessage = null
    this.onerror = null

    // Simulate immediate connection
    setTimeout(() => {
      this.readyState = 1 // OPEN
    }, 0)
  }

  close() {
    this.readyState = 2 // CLOSED
    this.onmessage = null
    this.onerror = null
  }

  // Helper for tests: simulate a message
  receive(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) })
    }
  }

  // Helper for tests: simulate an error
  triggerError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

let mockEventSourceInstance = null

beforeEach(() => {
  global.EventSource = vi.fn((url) => {
    const instance = new MockEventSource(url)
    mockEventSourceInstance = instance
    return instance
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockEventSourceInstance = null
})

// ── Initial state ────────────────────────────────────────────────────

it('starts with empty text, not streaming, no error', () => {
  const { result } = renderHook(() => useSSE('http://example.com/hint'))

  expect(result.current.streamedText).toBe('')
  expect(result.current.isStreaming).toBe(false)
  expect(result.current.error).toBeNull()
})

// ── Start receives chunks ────────────────────────────────────────────

it('streams text chunks from EventSource', async () => {
  const { result } = renderHook(() => useSSE('http://example.com/hint'))

  act(() => {
    result.current.start()
  })

  // Simulate incoming chunks
  act(() => {
    mockEventSourceInstance.receive({ chunk: 'Hello ' })
  })
  act(() => {
    mockEventSourceInstance.receive({ chunk: 'World' })
  })

  await waitFor(() => {
    expect(result.current.streamedText).toBe('Hello World')
  })
  expect(result.current.isStreaming).toBe(true)
  expect(result.current.error).toBeNull()
})

// ── Done signal stops streaming ──────────────────────────────────────

it('stops streaming when done signal is received', async () => {
  const { result } = renderHook(() => useSSE('http://example.com/hint'))

  act(() => {
    result.current.start()
  })

  act(() => {
    mockEventSourceInstance.receive({ chunk: 'Some hint text' })
  })
  act(() => {
    mockEventSourceInstance.receive({ done: true })
  })

  await waitFor(() => {
    expect(result.current.isStreaming).toBe(false)
  })
  expect(result.current.streamedText).toBe('Some hint text')
})

// ── Error handling ───────────────────────────────────────────────────

it('sets error on EventSource error', async () => {
  const { result } = renderHook(() => useSSE('http://example.com/hint'))

  act(() => {
    result.current.start()
  })

  act(() => {
    mockEventSourceInstance.triggerError()
  })

  await waitFor(() => {
    expect(result.current.error).toBeTruthy()
  })
  expect(result.current.isStreaming).toBe(false)
})

// ── Reset clears state and closes connection ─────────────────────────

it('reset clears text, error, and stops', async () => {
  const { result } = renderHook(() => useSSE('http://example.com/hint'))

  act(() => {
    result.current.start()
  })
  act(() => {
    mockEventSourceInstance.receive({ chunk: 'data' })
  })

  await waitFor(() => {
    expect(result.current.streamedText).toBe('data')
  })

  act(() => {
    result.current.reset()
  })

  expect(result.current.streamedText).toBe('')
  expect(result.current.error).toBeNull()
  expect(result.current.isStreaming).toBe(false)
})

// ── URL change causes new EventSource ────────────────────────────────

it('creates a new EventSource when url changes', async () => {
  const { result, rerender } = renderHook(({ url }) => useSSE(url), {
    initialProps: { url: 'http://example.com/hint?tier=1' },
  })

  act(() => {
    result.current.start()
  })
  expect(global.EventSource).toHaveBeenCalledWith(
    'http://example.com/hint?tier=1',
  )

  // Rerender with new URL
  rerender({ url: 'http://example.com/hint?tier=2' })
  act(() => {
    result.current.start()
  })
  expect(global.EventSource).toHaveBeenCalledWith(
    'http://example.com/hint?tier=2',
  )
})

// ── Cleanup on unmount ───────────────────────────────────────────────

it('closes EventSource on unmount', () => {
  const closeSpy = vi.fn()
  global.EventSource = vi.fn(() => ({
    close: closeSpy,
  }))

  const { result, unmount } = renderHook(() => useSSE('http://example.com/hint'))
  // Must start the stream so eventSourceRef gets set
  act(() => {
    result.current.start()
  })
  unmount()

  expect(closeSpy).toHaveBeenCalled()
})
