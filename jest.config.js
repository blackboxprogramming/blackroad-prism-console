module.exports = {
  testEnvironment: 'node',
  verbose: true,
  roots: [
    '<rootDir>/tests',
    '<rootDir>/packages/graph-engines/tests',
    '<rootDir>/packages/graph-gateway/tests',
    '<rootDir>/packages/ricci-engine/tests'
  ],
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).mjs'
  ]
};
