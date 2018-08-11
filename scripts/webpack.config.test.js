/* eslint-disable typescript/no-var-requires */
const path = require('path')
const glob = require('glob')

module.exports = {
  entry: glob.sync(path.resolve(__dirname, '../test/**/*.spec.ts')),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{ test: /\.ts$/, use: ['webpack-espower-loader', 'ts-loader'] }]
  },
  mode: 'development',
  devtool: 'cheap-module-eval-source-map'
}
