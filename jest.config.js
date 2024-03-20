/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: ['./build/'],
  moduleNameMapper: {
    "^jose": require.resolve("jose"),
  },
  setupFilesAfterEnv: ['./jest.setup.ts']
};
