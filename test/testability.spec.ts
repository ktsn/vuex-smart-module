import * as Vuex from 'vuex'
import { Module, Mutations, createStore } from '../src'
import { createLocalVue } from '@vue/test-utils'

class TestState {
  count = 0
}

class TestMutations extends Mutations<TestState> {
  inc() {
    this.state.count++
  }
}

const test = new Module({
  state: TestState,
  mutations: TestMutations
})

const localVue = createLocalVue()
localVue.use(Vuex)

describe('testability', () => {
  const originalMutations = test.options.mutations
  afterEach(() => {
    test.options.mutations = originalMutations
  })

  it('can mock module options', done => {
    class MockMutations extends TestMutations {
      inc() {
        done()
      }
    }

    test.options.mutations = MockMutations
    const store = createStore(test)

    store.commit('inc')
  })
})
