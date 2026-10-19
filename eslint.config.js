import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

/**
 * The layers, and what each may import. Enforced with `no-restricted-imports`
 * so that a shortcut across a boundary fails the lint rather than waiting for
 * a review to notice it.
 *
 *   types   → nothing
 *   domain  → types                      (pure: no React, no router, no i18n)
 *   api     → domain, types              (+ React Query)
 *   media   → domain, i18n               (audio, GIFs, canvas; no features)
 *   i18n    → domain, types
 *   app     → anything
 *   components → anything but a feature's internals
 *   features/X → anything but another feature's internals: a feature exposes
 *                what it shares through its `index.ts`; `features/shared` is
 *                open to all
 */
const forbid = (patterns, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: patterns, message }] }],
})

const FEATURE_INTERNALS = ['@/features/*/*', '!@/features/shared/*']
// Spelled out rather than globbed: these patterns match path segments, and
// `react-*` would also catch `@tanstack/react-query`.
const REACT_UI = ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next']

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
  },
  {
    // The dev scripts and this config run under Node, not in the page.
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', globals: globals.node },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: forbid(
      [
        ...REACT_UI,
        '@tanstack/react-query',
        '@/api/*',
        '@/app/*',
        '@/components/*',
        '@/features/*',
        '@/i18n/*',
        '@/media/*',
      ],
      'The domain reads payloads and decides; it does not fetch, render or translate.',
    ),
  },
  {
    files: ['src/api/**/*.ts'],
    rules: forbid(
      [...REACT_UI, '@/app/*', '@/components/*', '@/features/*', '@/i18n/*', '@/media/*'],
      'The api layer fetches and names queries; the UI and the words are elsewhere.',
    ),
  },
  {
    files: ['src/media/**/*.{ts,tsx}'],
    rules: forbid(
      ['@/api/*', '@/app/*', '@/components/*', '@/features/*'],
      'Media plays sounds and reads pictures; it knows nothing of pages.',
    ),
  },
  {
    files: ['src/i18n/**/*.ts'],
    rules: forbid(
      ['@/api/*', '@/app/*', '@/components/*', '@/features/*', '@/media/*'],
      'i18n labels slugs and loads tables; it does not import the UI.',
    ),
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: forbid(
      FEATURE_INTERNALS,
      'A shared component may not reach into a feature; move what it needs to features/shared.',
    ),
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: forbid(
      FEATURE_INTERNALS,
      "Import another feature through its index.ts, or move what is shared to features/shared.",
    ),
  },
])
