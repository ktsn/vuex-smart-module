import * as assert from 'power-assert'
import { createStore, Getters, Mutations, Actions, Module } from '../src'

describe('Nested modules', () => {
  class FooState {
    value = 1
  }

  class FooGetters extends Getters<FooState> {
    get double(): number {
      return this.state.value * 2
    }
  }

  class FooMutations extends Mutations<FooState> {
    inc(amount: number) {
      this.state.value += amount
    }
  }

  class FooActions extends Actions<
    FooState,
    FooGetters,
    FooMutations,
    FooActions
  > {
    inc(amount: number) {
      this.commit('inc', amount)
    }
  }

  let foo: Module<FooState, FooGetters, FooMutations, FooActions, any>
  beforeEach(() => {
    foo = new Module({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: FooActions,
    })
  })

  it('allows to access to nested module via a parent context', () => {
    const root = new Module({
      modules: {
        foo,
      },
    })

    const store = createStore(root)
    const ctx = root.context(store)
    const fooCtx = ctx.modules.foo

    assert(fooCtx.state.value === 1)
    assert(fooCtx.getters.double === 2)

    fooCtx.commit('inc', 1)
    assert(fooCtx.state.value === 2)
    assert(fooCtx.getters.double === 4)

    fooCtx.dispatch('inc', 2)
    assert(fooCtx.state.value === 4)
    assert(fooCtx.getters.double === 8)
  })
})
