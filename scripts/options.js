const pkg = require('../package.json')

module.exports = [
  {
    output: `dist/${pkg.name}.cjs.js`,
    format: 'cjs'
  },
  {
    output: `dist/${pkg.name}.esm.js`,
    format: 'es'
  },
  {
    output: `dist/${pkg.name}.js`,
    format: 'umd',
    env: 'development'
  },
  {
    output: `dist/${pkg.name}.min.js`,
    format: 'umd',
    env: 'production'
  }
]
