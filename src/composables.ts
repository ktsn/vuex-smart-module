import { getCurrentInstance } from '@vue/composition-api'
import { Module } from './module'
import { assert } from './utils'

export function createComposable<Mod extends Module<any, any, any, any, any>>(
  module: Mod
) {
  return function useContext() {
    const vm = getCurrentInstance()?.proxy
    assert(vm, 'Failed to get the current component instance')
    assert(vm.$store, 'Vuex store is not installed')

    return module.context(vm.$store)
  }
}
