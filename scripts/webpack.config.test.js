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
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader']
      },

      {
        enforce: 'post',
        test: /\.ts$/,
        include: [path.resolve(__dirname, '../test')],
        use: ['webpack-espower-loader']
      }
    ]
  },
  mode: 'development',
  devtool: 'module-eval-source-map'
}
