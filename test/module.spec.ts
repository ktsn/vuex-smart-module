import * as assert from 'power-assert'
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
import { Getters, Mutations, Actions, Module } from '../src'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Module', () => {
  describe('generate', () => {
    class FooState {
      value = 1
    }

    class FooGetters extends Getters<FooState>() {
      get double(): number {
        return this.state.value * 2
      }
    }

    class FooMutations extends Mutations<FooState>() {
      inc() {
        this.state.value++
      }
    }

    class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
      inc() {
        return new Promise(resolve => {
          setTimeout(() => {
            this.commit('inc', undefined)
            resolve()
          }, 0)
        })
      }
    }

    it('generates vuex module', () => {
      const m = new Module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
        actions: FooActions
      })

      const store = new Vuex.Store({
        ...m.create(),
        plugins: [m.plugin()]
      })

      assert(store.state.value === 1)
      assert(store.getters.double === 2)
      store.commit('inc')
      assert(store.state.value === 2)
      return store.dispatch('inc').then(() => {
        assert(store.state.value === 3)
      })
    })

    it('generates nested modules', () => {
      const foo = new Module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
        actions: FooActions
      })

      const root = new Module({
        modules: {
          foo
        }
      })

      const store = new Vuex.Store({
        ...root.create(),
        plugins: [root.plugin()]
      })

      assert(store.state.foo.value === 1)
      assert(store.getters['foo/double'] === 2)
      store.commit('foo/inc')
      assert(store.state.foo.value === 2)
      return store.dispatch('foo/inc').then(() => {
        assert(store.state.foo.value === 3)
      })
    })
  })
})
