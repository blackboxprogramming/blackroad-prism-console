const sharedGlobals = {
  require: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  global: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  fetch: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  URL: 'readonly',
  AbortController: 'readonly',
  PerformanceObserver: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  localStorage: 'readonly',
  indexedDB: 'readonly',
  WebAssembly: 'readonly',
  WebSocket: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  before: 'readonly',
  after: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  jest: 'readonly',
  cy: 'readonly',
  Cypress: 'readonly',
  alert: 'readonly'
};

const sharedRules = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-undef': 'warn'
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.github/**',
      '.tools/**',
      'public/vendor/**',
      'var/**',
      'apps/**',
      'backend/**',
      'design/**',
      'frontend/**',
      'modules/**',
      'scripts/**',
      'services/**',
      'sites/**',
      'src/**',
      'srv/**',
      'tests/**',
      'tools/**',
      'connectors.js'
    ]
  },
  {
    files: ['**/*.{js,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: sharedGlobals
    },
    rules: sharedRules
  },
  {
    files: [
      '**/*.mjs',
      '**/postcss.config.js',
      '**/tailwind.config.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: sharedGlobals
    },
    rules: sharedRules
  }
];
