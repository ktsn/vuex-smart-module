import * as assert from 'power-assert'
import * as Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
import {
  Module,
  Mutations,
  Actions,
  registerModule,
  unregisterModule,
} from '../src'

const localVue = createLocalVue()
localVue.use(Vuex)

class TestState {
  count = 0
}

class TestMutations extends Mutations<TestState> {
  inc() {
    this.state.count++
  }
}

let test: Module<TestState, never, TestMutations, any>

beforeEach(() => {
  test = new Module({
    state: TestState,
    mutations: TestMutations,
  })
})

describe('registerModule', () => {
  it('registers module', () => {
    const store = new Vuex.Store<any>({})
    registerModule(store, 'test', 'test', test)

    assert(store.state.test.count === 0)
    store.commit('test/inc')
    assert(store.state.test.count === 1)
  })

  it('passes module options of vuex', () => {
    const store = new Vuex.Store<any>({})
    store.replaceState({
      test: {
        count: 10,
      },
    })

    registerModule(store, 'test', 'test', test, {
      preserveState: true,
    })

    assert(store.state.test.count === 10)
  })

  it('calls $init hook', (done) => {
    class FooActions extends Actions<{}, never, any, FooActions> {
      $init() {
        done()
      }
    }

    const foo = new Module({
      actions: FooActions,
    })

    const store = new Vuex.Store({})
    registerModule(store, ['foo'], 'foo', foo)
  })
})

describe('unregisterModule', () => {
  it('unregisters module', () => {
    const store = new Vuex.Store<any>({})

    registerModule(store, 'test', 'test', test)
    unregisterModule(store, test)

    assert(store.state.test === undefined)
  })
})
