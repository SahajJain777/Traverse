import '@testing-library/jest-dom'

// Mock localStorage for useSession hook tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Suppress specific console warnings during tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  const msg = args.join(' ')
  if (msg.includes('ReactDOM.render is no longer supported')) return
  if (msg.includes('inside a test was not wrapped in act')) return
  originalConsoleWarn.call(console, ...args)
}
