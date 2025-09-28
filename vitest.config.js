import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.js', '**/*.spec.js'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.test.js', '**/*.spec.js'],
      include: ['FrenchGrammarImposters/**/*.{js,mjs}'],
      reportsDirectory: './coverage'
    }
  }
})