/* eslint-disable typescript/no-var-requires */
const fs = require('fs')
const { rollup } = require('rollup')
const replace = require('rollup-plugin-replace')
const uglify = require('uglify-js')
const options = require('./options')
const pkg = require('../package.json')

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.homepage}
 *
 * @license
 * Copyright (c) 2018 ${pkg.author}
 * Released under the MIT license
 * ${pkg.homepage}/blob/master/LICENSE
 */`

const baseConfig = {
  input: 'lib/index.js',
  output: {
    name: capitalize(pkg.name),
    banner
  },
  plugins: []
}

function run(options) {
  if (options.length === 0) return

  const [head, ...tail] = options
  const config = genConfig(head)

  return build(config)
    .then(bundle => write(config, bundle, head.env === 'production'))
    .then(() => run(tail))
    .catch(err => {
      console.error(err.stack)
      process.exit(1)
    })
}

function genConfig(options) {
  const res = Object.assign({}, baseConfig)

  res.output = Object.assign({}, res.output, {
    file: options.output,
    format: options.format
  })

  if (options.env) {
    res.plugins = res.plugins.concat([
      replace({
        'process.env.NODE_ENV': JSON.stringify(options.env)
      })
    ])
  }

  return res
}

function build(config) {
  return rollup(config)
}

function write(config, bundle, prod) {
  if (!prod) {
    return bundle.write(config.output)
  } else {
    return bundle
      .generate(config.output)
      .then(minify)
      .then(({ code }) => {
        return new Promise((resolve, reject) => {
          fs.writeFile(config.output.file, code, err => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        })
      })
  }
}

function minify({ code }) {
  return uglify.minify(code, {
    compress: {
      toplevel: true
    },
    output: {
      beautify: false,
      comments: /(?:^!|@license)/
    }
  })
}

function capitalize(str) {
  const camelized = str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
  return camelized[0].toUpperCase() + camelized.slice(1)
}

run(options)
