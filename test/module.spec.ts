import * as assert from 'power-assert'
import Vue from 'vue'
import * as Vuex from 'vuex'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import { createStore, Getters, Mutations, Actions, Module } from '../src'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Module', () => {
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
      return new Promise(resolve => {
        setTimeout(() => {
          this.commit('inc', undefined)
          resolve()
        }, 0)
      })
    }
  }

  describe('generate', () => {
    it('generates vuex module', () => {
      const m = new Module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
        actions: FooActions
      })

      const store = createStore(m)

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

      const store = createStore(root)

      assert(store.state.foo.value === 1)
      assert(store.getters['foo/double'] === 2)
      store.commit('foo/inc')
      assert(store.state.foo.value === 2)
      return store.dispatch('foo/inc').then(() => {
        assert(store.state.foo.value === 3)
      })
    })

    it('generates no namespaced modules', () => {
      const foo = new Module({
        namespaced: false,
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

      const store = createStore(root)

      assert(store.state.foo.value === 1)
      assert(store.getters.double === 2)
      store.commit('inc')
      assert(store.state.foo.value === 2)
      return store.dispatch('inc').then(() => {
        assert(store.state.foo.value === 3)
      })
    })

    it('handles complex namespace', () => {
      const baz = new Module({
        state: FooState,
        mutations: FooMutations
      })

      const bar = new Module({
        namespaced: false,
        state: FooState,
        mutations: FooMutations,
        modules: {
          baz
        }
      })

      const foo = new Module({
        state: FooState,
        mutations: FooMutations,
        modules: {
          bar
        }
      })

      const root = new Module({
        modules: {
          foo
        }
      })

      const store = createStore(root)

      assert(store.state.foo.value === 1)
      assert(store.state.foo.bar.value === 1)
      assert(store.state.foo.bar.baz.value === 1)

      store.commit('foo/inc')
      assert(store.state.foo.value === 2)
      assert(store.state.foo.bar.value === 2)
      assert(store.state.foo.bar.baz.value === 1)

      store.commit('foo/baz/inc')
      assert(store.state.foo.value === 2)
      assert(store.state.foo.bar.value === 2)
      assert(store.state.foo.bar.baz.value === 2)
    })
  })

  describe('getters', () => {
    it('has state reference', () => {
      const root = new Module({
        state: FooState,
        getters: FooGetters
      })

      const store = createStore(root)

      assert(store.getters.double === 2)
    })

    it('has state and getters reference', () => {
      class TestGetters extends Getters<FooState> {
        get five(): number {
          return 5
        }

        get ten(): number {
          return this.getters.five * 2
        }
      }

      const root = new Module({
        state: FooState,
        getters: TestGetters
      })

      const store = createStore(root)

      assert(store.getters.ten === 10)
    })

    it('can has method style getters', () => {
      class TestGetters extends Getters<FooState> {
        add(n: number): number {
          return this.state.value + n
        }
      }

      const root = new Module({
        state: FooState,
        getters: TestGetters
      })

      const store = createStore(root)

      assert(store.getters.add(5) === 6)
    })
  })

  describe('mutations', () => {
    it('has state reference', () => {
      const root = new Module({
        state: FooState,
        mutations: FooMutations
      })

      const store = createStore(root)
      store.commit('inc')
      assert(store.state.value === 2)
    })
  })

  describe('actions', () => {
    it('has state reference', done => {
      class TestActions extends Actions<FooState> {
        test(): void {
          assert(this.state.value === 1)
          done()
        }
      }

      const root = new Module({
        state: FooState,
        actions: TestActions
      })

      const store = createStore(root)
      store.dispatch('test')
    })

    it('has getters reference', done => {
      class TestActions extends Actions<FooState, FooGetters> {
        test(): void {
          assert(this.getters.double === 2)
          done()
        }
      }

      const root = new Module({
        state: FooState,
        getters: FooGetters,
        actions: TestActions
      })

      const store = createStore(root)
      store.dispatch('test')
    })

    it('has commit reference', async () => {
      const root = new Module({
        state: FooState,
        mutations: FooMutations,
        actions: FooActions
      })

      const store = createStore(root)
      await store.dispatch('inc')
      assert(store.state.value === 2)
    })

    it('has dispatch reference', done => {
      class TestActions extends Actions<{}, Getters, Mutations, TestActions> {
        one(): void {
          this.dispatch('two', undefined)
        }

        two(): void {
          done()
        }
      }

      const root = new Module({
        actions: TestActions
      })

      const store = createStore(root)
      store.dispatch('one')
    })
  })

  describe('proxy', () => {
    it('works like a local context object', () => {
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

      const store = createStore(root)

      const ctx = foo.context(store)

      assert(ctx.state.value === 1)
      assert(ctx.getters.double === 2)
      ctx.commit('inc', undefined)
      assert(ctx.state.value === 2)
      return ctx.dispatch('inc', undefined).then(() => {
        assert(ctx.state.value === 3)
      })
    })
  })

  describe('component mappers', () => {
    const fooModule = new Module({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: FooActions
    })

    const root = new Module({
      modules: {
        foo: fooModule
      }
    })

    const foo = fooModule.componentMapper()

    let store: Vuex.Store<any>

    beforeEach(() => {
      store = createStore(root)
    })

    describe('state', () => {
      it('maps state', () => {
        const Test = Vue.extend({
          computed: foo.mapState(['value']),

          render(h): any {
            return h('div', [this.value.toString()])
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        assert(wrapper.text() === '1')
        store.state.foo.value = 2
        assert(wrapper.text() === '2')
      })

      it('maps state with object syntax', () => {
        const Test = Vue.extend({
          computed: foo.mapState({
            test: 'value'
          }),

          render(h): any {
            return h('div', [this.test.toString()])
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        assert(wrapper.text() === '1')
        store.state.foo.value = 2
        assert(wrapper.text() === '2')
      })

      it('maps state with mapper function', () => {
        const Test = Vue.extend({
          computed: foo.mapState({
            value: (state, getters) => {
              return state.value + getters.double
            }
          }),

          render(h): any {
            return h('div', [this.value.toString()])
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        assert(wrapper.text() === '3')
        store.state.foo.value = 2
        assert(wrapper.text() === '6')
      })
    })

    describe('getters', () => {
      it('maps getters', () => {
        const Test = Vue.extend({
          computed: foo.mapGetters(['double']),

          render(h): any {
            return h('div', [this.double.toString()])
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        assert(wrapper.text() === '2')
        store.state.foo.value = 2
        assert(wrapper.text() === '4')
      })

      it('maps getters with object syntax', () => {
        const Test = Vue.extend({
          computed: foo.mapGetters({
            test: 'double'
          }),

          render(h): any {
            return h('div', [this.test.toString()])
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        assert(wrapper.text() === '2')
        store.state.foo.value = 2
        assert(wrapper.text() === '4')
      })
    })

    describe('mutations', () => {
      it('maps mutations', () => {
        const Test = Vue.extend({
          methods: foo.mapMutations(['inc']),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        vm.inc()
        assert(store.state.foo.value === 2)
      })

      it('maps mutations with object syntax', () => {
        const Test = Vue.extend({
          methods: foo.mapMutations({
            increment: 'inc'
          }),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        vm.increment()
        assert(store.state.foo.value === 2)
      })

      it('maps mutations with mapper function', () => {
        const Test = Vue.extend({
          methods: foo.mapMutations({
            add: (commit, payload: number) => {
              while (payload > 0) {
                commit('inc', undefined)
                payload--
              }
            }
          }),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        vm.add(3)
        assert(store.state.foo.value === 4)
      })
    })

    describe('actions', () => {
      it('maps actions', () => {
        const Test = Vue.extend({
          methods: foo.mapActions(['inc']),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        return vm.inc().then(() => {
          assert(store.state.foo.value === 2)
        })
      })

      it('maps actions with object syntax', () => {
        const Test = Vue.extend({
          methods: foo.mapActions({
            increment: 'inc'
          }),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        return vm.increment().then(() => {
          assert(store.state.foo.value === 2)
        })
      })

      it('maps actions with mapper function', () => {
        const Test = Vue.extend({
          methods: foo.mapActions({
            add: (dispatch, payload: number) => {
              const p: Promise<void>[] = []
              while (payload > 0) {
                p.push(dispatch('inc', undefined))
                payload--
              }
              return Promise.all(p)
            }
          }),

          render(h): any {
            return h('div')
          }
        })

        const wrapper = shallowMount(Test, {
          localVue,
          store
        })

        const vm: InstanceType<typeof Test> = wrapper.vm
        return vm.add(3).then(() => {
          assert(store.state.foo.value === 4)
        })
      })
    })
  })
})
