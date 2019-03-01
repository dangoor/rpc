const path = require('path');
const packageDir = path.resolve(__dirname, 'packages');

module.exports = {
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json'
    },
  },
  moduleFileExtensions: ['ts', 'js'],
  // notify: true,
  notifyMode: 'failure', // https://jestjs.io/docs/en/configuration.html#notifymode-string
  rootDir: packageDir,
  // roots: ['<rootDir>packages'],
  testMatch: ['**/__tests__/*.+(ts|js)', '**/*.test.+(ts|js)'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  moduleDirectories: [
    "node_modules",
    packageDir,
  ],
};