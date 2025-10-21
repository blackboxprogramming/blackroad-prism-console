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
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: false,
    fileServerFolder: 'dist'
  }
})
