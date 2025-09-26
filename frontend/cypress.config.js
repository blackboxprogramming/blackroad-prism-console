import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    supportFile: false
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    supportFile: 'cypress/support/component.js'
  }
})
