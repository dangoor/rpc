module.exports = {
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json'
    },
  },
  moduleFileExtensions: ['ts', 'js'],
  // notify: true,
  notifyMode: 'always',
  roots: ['<rootDir>packages'],
  testMatch: ['**/__tests__/*.+(ts|js)', '**/*.test.+(ts|js)'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
};