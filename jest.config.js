module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./test/setup.ts'],
  globals: {
    'ts-jest': {
      tsConfig: './test/tsconfig.json',
    },
  },
}
