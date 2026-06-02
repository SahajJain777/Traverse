import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import VisualSandbox from '../components/VisualSandbox'

function renderSandbox(props = {}) {
  const defaults = {
    html: null,
    fallbackText: null,
    onRegenerate: vi.fn(),
    isLoading: false,
  }
  return render(<VisualSandbox {...defaults} {...props} />)
}

// ── Loading state ────────────────────────────────────────────────────

it('shows loading spinner and message when isLoading is true', () => {
  renderSandbox({ isLoading: true })

  expect(screen.getByText('Generating animation...')).toBeInTheDocument()
  expect(screen.getByText('Algorithm Visualisation')).toBeInTheDocument()
})

it('disables regenerate button when isLoading is true', () => {
  renderSandbox({ isLoading: true })

  const button = screen.getByRole('button', { name: /generating/i })
  expect(button).toBeDisabled()
})

// ── HTML iframe rendering ────────────────────────────────────────────

it('renders iframe when html is provided', () => {
  const testHtml = '<html><body><script>let x=1</script></body></html>'
  renderSandbox({ html: testHtml })

  const iframe = screen.getByTitle('Algorithm Visualisation')
  expect(iframe).toBeInTheDocument()
  expect(iframe).toHaveAttribute('sandbox', 'allow-scripts')
  expect(iframe).toHaveAttribute('srcDoc', testHtml)
})

it('does not show fallback text when html is provided', () => {
  renderSandbox({
    html: '<html><body><script>let x=1</script></body></html>',
    fallbackText: 'some fallback',
  })

  expect(screen.getByTitle('Algorithm Visualisation')).toBeInTheDocument()
  expect(screen.queryByText('some fallback')).not.toBeInTheDocument()
})

// ── Fallback text ────────────────────────────────────────────────────

it('renders fallback text when html is not provided', () => {
  renderSandbox({ fallbackText: 'It works by iterating...' })

  expect(screen.getByText('Visualisation Fallback')).toBeInTheDocument()
  expect(screen.getByText('It works by iterating...')).toBeInTheDocument()
})

it('does not show fallback when both html and fallback are null', () => {
  renderSandbox()

  expect(screen.queryByText('Visualisation Fallback')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Algorithm Visualisation')).not.toBeInTheDocument()
})

// ── Regenerate button ────────────────────────────────────────────────

it('calls onRegenerate when regenerate button is clicked', async () => {
  const onRegenerate = vi.fn()
  renderSandbox({
    fallbackText: 'fallback',
    onRegenerate,
  })

  const button = screen.getByRole('button', { name: /regenerate/i })
  await userEvent.click(button)

  expect(onRegenerate).toHaveBeenCalledOnce()
})

it('regenerate button shows Regenerate label when not loading (no html)', () => {
  renderSandbox({ fallbackText: 'fallback' })

  expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
})
