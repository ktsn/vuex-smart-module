/**
 * This file is to test whether types would pass compilation.
 */

import { Mutations, Actions, Module, createStore, Getters } from '../src'

export function shouldInferUnionTypeContainsUndefined() {
  class TestMutations extends Mutations {
    test(_test = true) {}
  }

  class TestActions extends Actions<{}, Getters, TestMutations> {
    test(_test = true) {}
    foo() {}
  }

  const test = new Module({
    mutations: TestMutations,
    actions: TestActions,
  })

  const store = createStore(test)

  const ctx = test.context(store)

  ctx.dispatch('test', undefined)
  ctx.dispatch('test', false)
  ctx.commit('test', undefined)
  ctx.commit('test', false)
}

// https://github.com/ktsn/vuex-smart-module/issues/30
export function canDeclareRecursiveModuleType() {
  class ChildActions extends Actions<{}, never, never, ChildActions> {
    rootModule!: RootModule

    child() {}
  }

  const child = new Module({
    actions: ChildActions,
  })

  class RootActions extends Actions<{}, never, never, RootActions> {
    root() {}
  }

  type RootModule = typeof root

  const root = new Module({
    actions: RootActions,
    modules: {
      child,
    },
  })
}

export function canDispatchOrCommitWithoutPayload() {
  class TestMutations extends Mutations {
    test() {}
  }

  class TestActions extends Actions<{}, Getters, TestMutations> {
    test() {}
  }

  const test = new Module({
    mutations: TestMutations,
    actions: TestActions,
  })

  const store = createStore(test)

  const ctx = test.context(store)

  ctx.dispatch('test')
  ctx.commit('test')
}
