import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import VisualSandbox from '../components/VisualSandbox'

function renderSandbox(props = {}) {
  const defaults = {
    html: null,
    fallbackText: null,
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

it('shows title bar alongside the iframe', () => {
  const testHtml = '<html><body><script>let x=1</script></body></html>'
  renderSandbox({ html: testHtml })

  // Title bar should be visible
  expect(screen.getByText('Algorithm Visualisation')).toBeInTheDocument()
  // Iframe should also be present
  expect(screen.getByTitle('Algorithm Visualisation')).toBeInTheDocument()
})

// ── Fallback text ────────────────────────────────────────────────────

it('renders fallback text when html is not provided', () => {
  renderSandbox({ fallbackText: 'It works by iterating...' })

  expect(screen.getByText('It works by iterating...')).toBeInTheDocument()
  expect(screen.getByText('Algorithm Visualisation')).toBeInTheDocument()
})

it('renders nothing when both html and fallback are null and not loading', () => {
  const { container } = renderSandbox()

  expect(container.innerHTML).toBe('')
})
