import { Store, ModuleOptions } from 'vuex'
import { Module } from './module'
import { assert } from './utils'

export function registerModule(
  store: Store<any>,
  path: string | string[],
  namespace: string | null,
  module: Module<any, any, any, any>,
  options?: ModuleOptions
): void {
  const normalizedPath = typeof path === 'string' ? [path] : path
  const { options: moduleOptions, injectStore } = module.create(
    normalizedPath,
    normalizeNamespace(namespace)
  )
  store.registerModule(normalizedPath, moduleOptions, options)
  injectStore(store)
}

export function unregisterModule(
  store: Store<any>,
  module: Module<any, any, any, any>
): void {
  assert(module.path, 'The module seems not registered in the store')
  store.unregisterModule(module.path!)
}

function normalizeNamespace(namespace: string | null): string {
  if (namespace === '' || namespace === null) {
    return ''
  }

  return namespace[namespace.length - 1] === '/' ? namespace : namespace + '/'
}
