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
    actions: TestActions
  })

  const store = createStore(test)

  const ctx = test.context(store)

  ctx.dispatch('test', undefined)
  ctx.dispatch('test', false)
  ctx.commit('test', undefined)
  ctx.commit('test', false)
}
