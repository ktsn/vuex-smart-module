import { Store, StoreOptions } from 'vuex'
import { Module } from './module'

export { Getters, Mutations, Actions } from './assets'
export { Module }

export function createStore(
  rootModule: Module<any, any, any, any>,
  options: StoreOptions<any> = {}
): Store<any> {
  const { options: rootModuleOptions, injectStore } = rootModule.create([], '')

  const plugin = (store: Store<any>) => {
    injectStore(store)
  }

  const store: Store<any> = new Store({
    ...options,
    ...rootModuleOptions,
    plugins: [plugin].concat(options.plugins || [])
  })

  return store
}
