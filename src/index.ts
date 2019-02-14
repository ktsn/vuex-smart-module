import { Store, StoreOptions } from 'vuex'
import { Module } from './module'

export { Getters, Mutations, Actions } from './assets'
export { Module }

export function createStore(
  rootModule: Module<any, any, any, any>,
  options: StoreOptions<any> = {}
): Store<any> {
  const store: Store<any> = new Store({
    ...options,
    ...rootModule.create(() => store, [], '')
  })
  return store
}
