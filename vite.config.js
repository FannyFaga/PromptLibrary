import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use node environment for pure-function tests (no DOM needed).
    // Switch to 'happy-dom' if you add component tests later.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
