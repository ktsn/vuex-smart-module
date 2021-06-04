import { getCurrentInstance } from '@vue/composition-api'
import { mount } from 'vue-composable-tester'
import { Store } from 'vuex'
import {
  Actions,
  createComposable,
  createStore,
  Getters,
  Module,
  Mutations,
} from '../src'

describe('composables', () => {
  class FooState {
    value = 1
  }

  class FooGetters extends Getters<FooState> {
    get double(): number {
      return this.state.value * 2
    }
  }

  class FooMutations extends Mutations<FooState> {
    inc() {
      this.state.value++
    }
  }

  class FooActions extends Actions<
    FooState,
    FooGetters,
    FooMutations,
    FooActions
  > {
    inc() {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.commit('inc', undefined)
          resolve()
        }, 0)
      })
    }
  }

  const foo = new Module({
    state: FooState,
    getters: FooGetters,
    mutations: FooMutations,
    actions: FooActions,
  })

  let store: Store<unknown>
  beforeEach(() => {
    store = createStore(foo)
  })

  describe('createComposable', () => {
    const useFooContext = createComposable(foo)

    it('state', () => {
      const { result } = mount(useFooContext, {
        provider: () => {
          getCurrentInstance()!.proxy.$store = store
        },
      })
      expect(result.state.value).toBe(1)
    })

    it('getters', () => {
      const { result } = mount(useFooContext, {
        provider: () => {
          getCurrentInstance()!.proxy.$store = store
        },
      })
      expect(result.getters.double).toBe(2)
    })

    it('mutations', () => {
      const { result } = mount(useFooContext, {
        provider: () => {
          getCurrentInstance()!.proxy.$store = store
        },
      })
      expect(result.state.value).toBe(1)
      result.commit('inc')
      expect(result.state.value).toBe(2)
    })

    it('actions', async () => {
      const { result } = mount(useFooContext, {
        provider: () => {
          getCurrentInstance()!.proxy.$store = store
        },
      })
      expect(result.getters.double).toBe(2)
      await result.dispatch('inc')
      expect(result.getters.double).toBe(4)
    })
  })
})
