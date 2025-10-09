<!-- FILE: jest.config.js -->
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'junit.xml',
      },
    ],
  ],
};
