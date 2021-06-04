import { useStore } from 'vuex'
import { Module } from './module'

export function createComposable<Mod extends Module<any, any, any, any, any>>(
  module: Mod
) {
  return function useContext() {
    const store = useStore()
    return module.context(store)
  }
}
