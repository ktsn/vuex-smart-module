import { Store, StoreOptions } from 'vuex'
import { Module } from './module'

export { Getters, Mutations, Actions } from './assets'
export { Dispatch, Commit, Context } from './context'
export { registerModule, unregisterModule } from './register'
export { Module }

export function createStore(
  rootModule: Module<any, any, any, any>,
  options: StoreOptions<any> = {}
): Store<any> {
  const { options: rootModuleOptions, injectStore } = rootModule.create([], '')

  const store: Store<any> = new Store({
    ...options,
    ...rootModuleOptions,
    plugins: [injectStore].concat(options.plugins || [])
  })

  return store
}
