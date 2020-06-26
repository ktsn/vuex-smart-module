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

    expect(fooCtx.state.value).toBe(1)
    expect(fooCtx.getters.double).toBe(2)

    fooCtx.commit('inc', 1)
    expect(fooCtx.state.value).toBe(2)
    expect(fooCtx.getters.double).toBe(4)

    fooCtx.dispatch('inc', 2)
    expect(fooCtx.state.value).toBe(4)
    expect(fooCtx.getters.double).toBe(8)
  })

  it("allows to access to nested module's actions and mutations", () => {
    const root = new Module({
      modules: {
        foo,
      },
    })

    const store = createStore(root)
    const ctx = root.context(store)
    const fooCtx = ctx.modules.foo

    expect(fooCtx.state.value).toBe(1)
    expect(fooCtx.getters.double).toBe(2)

    fooCtx.mutations.inc(1)
    expect(fooCtx.state.value).toBe(2)
    expect(fooCtx.getters.double).toBe(4)

    fooCtx.actions.inc(2)
    expect(fooCtx.state.value).toBe(4)
    expect(fooCtx.getters.double).toBe(8)
  })
})
