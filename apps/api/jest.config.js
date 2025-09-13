export default {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
  testMatch: ['**/?(*.)+(test).[tj]s?(x)']
};
