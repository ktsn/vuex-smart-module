import * as Vuex from 'vuex'
import { Module, Mutations, createStore, Getters, Actions } from '../src'
import { createLocalVue } from '@vue/test-utils'
import { inject } from '../src/assets'

class TestState {
  count = 0
}

class TestGetters extends Getters<TestState> {
  get double() {
    return this.state.count * 2
  }
}

class TestMutations extends Mutations<TestState> {
  inc() {
    this.state.count++
  }
}

class TestActions extends Actions<
  TestState,
  TestGetters,
  TestMutations,
  TestActions
> {
  inc() {
    this.commit('inc', undefined)
  }

  incBypass() {
    this.actions.inc()
  }

  incCall() {
    this.mutations.inc()
  }
}

const test = new Module({
  state: TestState,
  getters: TestGetters,
  mutations: TestMutations,
  actions: TestActions,
})

const localVue = createLocalVue()
localVue.use(Vuex)

describe('testability', () => {
  const originalMutations = test.options.mutations
  afterEach(() => {
    test.options.mutations = originalMutations
  })

  it('can mock module options', (done) => {
    class MockMutations extends TestMutations {
      inc() {
        done()
      }
    }

    test.options.mutations = MockMutations
    const store = createStore(test)

    store.commit('inc')
  })

  it('tests getters', () => {
    const getters = inject(TestGetters, {
      state: {
        count: 5,
      },
    })
    expect(getters.double).toBe(10)
  })

  it('tests mutations', () => {
    const state = {
      count: 10,
    }
    const mutations = inject(TestMutations, {
      state,
    })
    mutations.inc()
    expect(state.count).toBe(11)
  })

  it('tests actions', () => {
    const commit = jest.fn()
    const actions = inject(TestActions, {
      commit,
    })
    actions.inc()
    expect(commit).toHaveBeenCalledWith('inc', undefined)
  })

  it('mocks actions in an action', () => {
    const inc = jest.fn()
    const actions = inject(TestActions, {
      actions: {
        inc,
      },
    })
    actions.incBypass()
    expect(inc).toHaveBeenCalled()
  })

  it('mocks mutations in an action', () => {
    const inc = jest.fn()
    const actions = inject(TestActions, {
      mutations: {
        inc,
      },
    })
    actions.incCall()
    expect(inc).toHaveBeenCalled()
  })
})
