module.exports = {
  testEnvironment: 'node',
  verbose: true,
  roots: [
    '<rootDir>/tests',
    '<rootDir>/packages/graph-engines/tests',
    '<rootDir>/packages/graph-gateway/tests',
    '<rootDir>/packages/diffusion-engine/tests',
    '<rootDir>/packages/diffusion-gateway/tests'
    '<rootDir>/packages/ricci-engine/tests'
  ],
  roots: ['<rootDir>/tests', '<rootDir>/packages/ot-engine/tests'],
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).mjs'
  ],
  transform: {
    '^.+\\.tsx?$': '<rootDir>/jest.transformer.cjs'
  },
  moduleNameMapper: {
    '^@blackroad/diffusion-engine$': '<rootDir>/packages/diffusion-engine/src/index.ts',
    '^@blackroad/diffusion-engine/(.*)$': '<rootDir>/packages/diffusion-engine/src/$1',
    '^@blackroad/diffusion-gateway$': '<rootDir>/packages/diffusion-gateway/src/index.ts',
    '^@blackroad/diffusion-gateway/(.*)$': '<rootDir>/packages/diffusion-gateway/src/$1'
  },
  extensionsToTreatAsEsm: ['.ts']
};
