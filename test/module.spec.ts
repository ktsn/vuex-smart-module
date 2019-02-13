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
