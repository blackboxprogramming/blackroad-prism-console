module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@blackroad/tokenomics-sim$': '<rootDir>/../tokenomics-sim/src'
  }
};
