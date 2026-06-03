export const APP_STATES = {
  INPUT: 'INPUT',
  HINT_LOOP: 'HINT_LOOP',
  OPTIMAL: 'OPTIMAL',
}

export const LANGUAGES = [
  { value: 'python', label: 'Python', monacoLang: 'python' },
  { value: 'java',   label: 'Java',   monacoLang: 'java'   },
  { value: 'cpp',    label: 'C++',    monacoLang: 'cpp'    },
]

export const HINT_TIERS = [
  { tier: 1, label: 'Subtle hint',       description: 'A nudge in the right direction' },
  { tier: 2, label: 'Method hint',       description: 'Names the approach category'    },
  { tier: 3, label: 'Step-by-step hint', description: 'Walks through the logic'        },
]

export const APPROACH_DIRECTIONS = {
  correct_path:       { label: 'On the right track',   color: 'var(--success-color)'  },
  wrong_path:         { label: 'Different approach needed', color: 'var(--hint-3-color)' },
  partially_correct:  { label: 'Partially correct',    color: 'var(--hint-2-color)'   },
}

export const STRINGS = {
  inputPlaceholder:           'Submit your attempt to receive guidance.',
  submitButton:               'Submit',
  goalReached:                '✓ You reached your goal.',
  seeOptimal:                 'See optimal approach →',
  newProblem:                 '+ New problem',
  generateVisual:             'Generate visual walkthrough',
  regenerateVisual:           'Regenerate',
  coldStartBanner:            'Waking up the server — first load takes ~30 seconds.',
  problemLabel:               'Problem',
  codeLabel:                  'Your solution',
  lastHintUsed:               'Last used:',
  checkSolution:              'Check my solution',
  generateMyVisual:           'Generate visual for my approach',
  viewOptimalBtn:             'View optimal solution →',
  studentCode:                'Your Code',
  optimalCode:                'Optimal Code',
  visualFallback:             'Visualisation could not be generated.',
  complexityStudent:          'Your complexity',
  complexityOptimal:          'Optimal complexity',
  getHint:                   'Get hint',
  nextHint:                  'Next hint',
  requestHintPlaceholder:    'Tap the button above to get a hint tailored to your approach.',

  // Right column tabs
  tabHints:                  'Hints',
  tabAnimation:              'Animation',
  tabSyntax:                 'Learn Syntax',
  syntaxCheck:               'Check syntax',
  syntaxTotalErrors:         'syntax error(s) found',
  syntaxNoErrors:            '✓ No syntax errors detected!',
  syntaxCheckPlaceholder:    'Paste your code in the editor, then click "Check syntax" to find and fix errors.',

  // Optimal overlay
  closeOptimal:               '← Back to hints',
}

export const RIBBON_COLORS = [
  'var(--ribbon-1)',
  'var(--ribbon-2)',
  'var(--ribbon-3)',
  'var(--ribbon-4)',
  'var(--ribbon-5)',
]

export const CELEBRATION_DURATION_MS = 2400
export const RIBBON_COUNT = 50
export const COLD_START_THRESHOLD_MS = 2500
