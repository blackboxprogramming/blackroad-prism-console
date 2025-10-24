module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@blackroad/control-plane-sdk$': '<rootDir>/tests/__mocks__/control-plane-sdk.ts',
    '^chalk$': '<rootDir>/tests/__mocks__/chalk.ts'
  }
};
