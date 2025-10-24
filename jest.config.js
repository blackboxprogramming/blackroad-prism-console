<!-- FILE: jest.config.js -->
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/tests', '<rootDir>/packages/ot-engine/tests'],
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).mjs',
  ],
};
