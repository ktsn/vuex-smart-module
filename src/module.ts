import {
  Store,
  StoreOptions,
  Plugin as VuexPlugin,
  GetterTree,
  CommitOptions,
  DispatchOptions,
  MutationTree,
  mapState,
  mapGetters,
  mapMutations,
  mapActions
} from 'vuex'
import { BG0, BM0, BA0, Payload } from './assets'
import { get, assert, Class, mapValues } from './utils'

export interface Commit<M> {
  <K extends keyof M>(
    type: K,
    payload: Payload<M[K]>,
    options?: CommitOptions
  ): void
  <K extends keyof M>(
    payload: Payload<M[K]> & { type: K },
    options?: CommitOptions
  ): void
}

export interface Dispatch<A> {
  <K extends keyof A>(
    type: K,
    payload: Payload<A[K]>,
    options?: DispatchOptions
  ): Promise<any>
  <K extends keyof A>(
    payload: Payload<A[K]> & { type: K },
    options?: DispatchOptions
  ): Promise<any>
}

export type MappedFunction<Fn, R> = Payload<Fn> extends undefined
  ? (payload?: Payload<Fn>) => R
  : (payload: Payload<Fn>) => R

export type RestArgs<Fn> = Fn extends (_: any, ...args: infer R) => any
  ? R
  : never

export interface ModuleOptions<S, G extends BG0, M extends BM0, A extends BA0> {
  state?: Class<S>
  getters?: Class<G>
  mutations?: Class<M>
  actions?: Class<A>
  modules?: Record<string, Module<any, any, any, any>>
}

export class Module<S, G extends BG0, M extends BM0, A extends BA0> {
  private path: string[] | undefined = undefined
  private store: Store<any> | undefined = undefined

  commit: Commit<M> = (type: any, payload: any, options?: any): void => {
    this.ensureStore()
    return this.normalizedDispatch(this.store!.commit, type, payload, options)
  }

  dispatch: Dispatch<A> = (type: any, payload: any, options?: any): any => {
    this.ensureStore()
    return this.normalizedDispatch(this.store!.dispatch, type, payload, options)
  }

  constructor(private options: ModuleOptions<S, G, M, A> = {}) {}

  create(): StoreOptions<any> {
    const { state, getters, mutations, actions, modules } = this.options

    return {
      state: state ? new state() : {},
      getters: getters ? initGetters(getters, this) : {},
      mutations: mutations ? initMutations(mutations, this) : {},
      actions: actions ? initActions(actions, this) : {},
      modules: !modules
        ? undefined
        : mapValues(modules, m => {
            return {
              namespaced: true,
              ...m.create()
            }
          })
    }
  }

  plugin(): VuexPlugin<any> {
    return store => {
      this.setStore(store, [])
    }
  }

  clone(): this {
    const options = {
      ...this.options
    }
    if (options.modules) {
      options.modules = mapValues(options.modules, m => m.clone())
    }
    return new Module(options) as this
  }

  mapState<K extends keyof S>(map: K[]): { [Key in K]: () => S[Key] }
  mapState<T extends Record<string, keyof S>>(
    map: T
  ): { [Key in keyof T]: () => S[T[Key]] }
  mapState<T extends Record<string, (state: S, getters: G) => any>>(
    map: T
  ): { [Key in keyof T]: () => ReturnType<T[Key]> }
  mapState(map: any): { [key: string]: () => any } {
    this.ensureStore()
    const namespace = this.namespace()
    return namespace === '' ? mapState(map) : mapState(namespace, map)
  }

  mapGetters<K extends keyof G>(map: K[]): { [Key in K]: () => G[Key] }
  mapGetters<T extends Record<string, keyof G>>(
    map: T
  ): { [Key in keyof T]: () => G[T[Key]] }
  mapGetters(map: any): { [key: string]: () => any } {
    this.ensureStore()
    const namespace = this.namespace()
    return namespace === '' ? mapGetters(map) : mapGetters(namespace, map)
  }

  mapMutations<K extends keyof M>(
    map: K[]
  ): { [Key in K]: MappedFunction<M[K], void> }
  mapMutations<T extends Record<string, keyof M>>(
    map: T
  ): { [Key in keyof T]: MappedFunction<M[T[Key]], void> }
  mapMutations<
    T extends Record<string, (commit: Commit<M>, ...args: any[]) => any>
  >(
    map: T
  ): { [Key in keyof T]: (...args: RestArgs<T[Key]>) => ReturnType<T[Key]> }
  mapMutations(map: any): { [key: string]: (...args: any[]) => any } {
    this.ensureStore()
    const namespace = this.namespace()
    return namespace === '' ? mapMutations(map) : mapMutations(namespace, map)
  }

  mapActions<K extends keyof A>(
    map: K[]
  ): { [Key in K]: MappedFunction<A[K], Promise<any>> }
  mapActions<T extends Record<string, keyof A>>(
    map: T
  ): { [Key in keyof T]: MappedFunction<A[T[Key]], Promise<any>> }
  mapActions<
    T extends Record<string, (dispatch: Dispatch<A>, ...args: any[]) => any>
  >(
    map: T
  ): { [Key in keyof T]: (...args: RestArgs<T[Key]>) => ReturnType<T[Key]> }
  mapActions(map: any): { [key: string]: (...args: any[]) => any } {
    this.ensureStore()
    const namespace = this.namespace()
    return namespace === '' ? mapActions(map) : mapActions(namespace, map)
  }

  get state(): S {
    this.ensureStore()
    return get(this.path!, this.store!.state)
  }

  get getters(): G {
    this.ensureStore()
    return this.namespacedGetters()
  }

  private setStore(store: Store<any>, path: string[]): void {
    const strModule = (path: string[]): string => path.join('/') || '/'

    assert(
      this.path === undefined && this.store === undefined,
      `The module '${strModule(path)}' is already registered on '${strModule(
        this.path || []
      )}'.` +
        ` You should duplicate it by 'clone()' method if you want to use the same module in multiple places.`
    )

    this.path = path
    this.store = store

    const modules = this.options.modules
    if (modules) {
      Object.keys(modules).forEach(key => {
        const m = modules[key]
        const p = path.concat(key)
        m.setStore(store, p)
      })
    }
  }

  private normalizedDispatch(
    dispatch: Function,
    type: any,
    payload: any,
    options: any
  ): any {
    if (typeof type === 'string') {
      return dispatch(this.namespacedType(type), payload, options)
    } else {
      return dispatch(
        {
          ...type,
          type: this.namespacedType(type.type)
        },
        payload
      )
    }
  }

  private namespacedGetters(): G {
    const namespace = this.namespace()
    const sliceIndex = namespace.length
    const getters: Record<string, any> = {}

    Object.keys(this.store!.getters).forEach(key => {
      const sameNamespace = namespace !== key.slice(0, sliceIndex)
      const name = key.slice(sliceIndex)
      if (sameNamespace && name) {
        return
      }

      Object.defineProperty(getters, name, {
        get: () => this.store!.getters[key],
        enumerable: true
      })
    })

    return getters as G
  }

  private namespace(): string {
    const path = this.path!
    return path.length === 0 ? '' : path.join('/') + '/'
  }

  private namespacedType(type: string): string {
    return this.namespace() + type
  }

  private ensureStore(): void {
    assert(
      this.path && this.store,
      'you need to provide the module into the Vuex store before using it.'
    )
  }
}

function initGetters<S, G extends BG0, M extends BM0, A extends BA0>(
  Getters: Class<G>,
  module: Module<S, G, M, A>
): GetterTree<any, any> {
  const getters: any = new Getters()
  getters.__module__ = module
  const options: GetterTree<any, any> = {}

  Object.getOwnPropertyNames(Getters.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Getters.prototype, key)
    if (!desc || (typeof desc.value !== 'function' && !desc.get)) {
      return
    }

    options[key] = () => getters[key]
  })

  return options
}

function initMutations<S, G extends BG0, M extends BM0, A extends BA0>(
  Mutations: Class<M>,
  module: Module<S, G, M, A>
): MutationTree<any> {
  const mutations: any = new Mutations()
  mutations.__module__ = module
  const options: MutationTree<any> = {}

  Object.getOwnPropertyNames(Mutations.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Mutations.prototype, key)
    if (!desc || typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => mutations[key](payload)
  })

  return options
}

function initActions<S, G extends BG0, M extends BM0, A extends BA0>(
  Actions: Class<A>,
  module: Module<S, G, M, A>
): MutationTree<any> {
  const actions: any = new Actions()
  actions.__module__ = module
  const options: MutationTree<any> = {}

  Object.getOwnPropertyNames(Actions.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Actions.prototype, key)
    if (!desc || typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => actions[key](payload)
  })

  return options
}
