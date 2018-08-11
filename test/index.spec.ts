import * as assert from 'power-assert'
import index from '../src/index'

describe('Entry point', () => {
  it('should provide module', () => {
    const actual = index
    assert.deepStrictEqual(actual, {})
  })
})
