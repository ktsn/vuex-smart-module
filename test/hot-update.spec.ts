import * as assert from 'power-assert'
import {
  createStore,
  Module,
  Getters,
  Mutations,
  Actions,
  hotUpdate,
} from '../src'
import { Store } from 'vuex'

describe('hotUpdate', () => {
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

  const foo = new Module({
    state: FooState,
    getters: FooGetters,
    mutations: FooMutations,
    actions: FooActions,
  })

  let store: Store<any>
  beforeEach(() => {
    store = createStore(foo)
  })

  it('does not update state', () => {
    assert(store.state.value === 1)

    class NewState {
      value = 100
    }

    const newFoo = new Module({
      state: NewState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: FooActions,
    })

    hotUpdate(store, newFoo)

    assert(store.state.value === 1)
  })

  it('updates a getter', () => {
    assert(store.getters.double === 2)

    class NewGetters extends Getters<FooState> {
      get double() {
        return this.state.value * 20
      }
    }

    const newFoo = new Module({
      state: FooState,
      getters: NewGetters,
      mutations: FooMutations,
      actions: FooActions,
    })

    hotUpdate(store, newFoo)

    assert(store.getters.double === 20)
  })

  it('updates a mutation', () => {
    store.commit('inc', 1)
    assert(store.state.value === 2)

    class NewMutations extends Mutations<FooState> {
      inc(amount: number) {
        this.state.value += amount * 10
      }
    }

    const newFoo = new Module({
      state: FooState,
      getters: FooGetters,
      mutations: NewMutations,
      actions: FooActions,
    })

    hotUpdate(store, newFoo)

    store.commit('inc', 1)
    assert(store.state.value === 12)
  })

  it('updates an action', () => {
    store.dispatch('inc', 1)
    assert(store.state.value === 2)

    class NewActions extends Actions<
      FooState,
      FooGetters,
      FooMutations,
      FooActions
    > {
      inc(amount: number) {
        this.commit('inc', amount * 10)
      }
    }

    const newFoo = new Module({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: NewActions,
    })

    hotUpdate(store, newFoo)

    store.dispatch('inc', 1)
    assert(store.state.value === 12)
  })
})
