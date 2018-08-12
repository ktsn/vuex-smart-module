import * as assert from 'power-assert'
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
import { Getters, Mutations, Actions, Module } from '../src'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Module', () => {
  describe('generate', () => {
    it('generates vuex module', () => {
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

      const m = new Module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
        actions: FooActions
      })

      // @ts-ignore
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
  })
})
