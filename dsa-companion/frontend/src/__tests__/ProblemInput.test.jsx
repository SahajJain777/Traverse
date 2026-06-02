import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import LeftPanel from '../components/LeftPanel'

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language }) => (
    <textarea
      data-testid="monaco-editor"
      data-language={language}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

function renderLeftPanel(props = {}) {
  const defaults = {
    problem: '',
    setProblem: vi.fn(),
    attempt: '',
    setAttempt: vi.fn(),
    language: 'python',
    setLanguage: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    appState: 'INPUT',
  }
  return render(<LeftPanel {...defaults} {...props} />)
}

// ── Renders all key elements ─────────────────────────────────────────

it('renders the labels, textareas, and Monaco editor', () => {
  renderLeftPanel({ problem: 'Two Sum Problem', attempt: 'def two_sum():' })

  expect(screen.getByText('Problem')).toBeInTheDocument()
  expect(screen.getByText('Your solution')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Two Sum Problem')).toBeInTheDocument()
  expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
})

// ── Language selector ────────────────────────────────────────────────

it('shows all three languages in the selector dropdown', () => {
  renderLeftPanel()

  const select = screen.getByRole('combobox')
  expect(select).toBeInTheDocument()

  const options = screen.getAllByRole('option')
  expect(options).toHaveLength(3)
  expect(options[0]).toHaveTextContent('Python')
  expect(options[1]).toHaveTextContent('Java')
  expect(options[2]).toHaveTextContent('C++')
})

it('calls setLanguage when a different language is selected', async () => {
  const setLanguage = vi.fn()
  renderLeftPanel({ setLanguage })

  const select = screen.getByRole('combobox')
  await userEvent.selectOptions(select, 'java')

  expect(setLanguage).toHaveBeenCalledWith('java')
})

// ── Submit button states ─────────────────────────────────────────────

it('submit button is disabled when input state is empty', () => {
  renderLeftPanel({ problem: '', attempt: '' })
  const button = screen.getByRole('button', { name: /submit/i })
  expect(button).toBeDisabled()
})

it('submit button is enabled when problem and attempt contain values', () => {
  renderLeftPanel({ problem: 'Two Sum', attempt: 'def solve():' })
  const button = screen.getByRole('button', { name: /submit/i })
  expect(button).not.toBeDisabled()
})

// ── Submit fires callback ────────────────────────────────────────────

it('calls onSubmit when form is submitted', async () => {
  const onSubmit = vi.fn()
  renderLeftPanel({
    problem: 'Two Sum',
    attempt: 'def solve():',
    onSubmit,
  })

  const button = screen.getByRole('button', { name: /submit/i })
  await userEvent.click(button)

  expect(onSubmit).toHaveBeenCalledWith('Two Sum', 'def solve():', 'python')
})

// ── Loading state ────────────────────────────────────────────────────

it('shows loader and disables submit when isLoading is true', () => {
  renderLeftPanel({ isLoading: true })

  expect(screen.getByText('Analyzing...')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled()
})
