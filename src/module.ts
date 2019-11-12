import {
  Store,
  Module as VuexModule,
  GetterTree,
  MutationTree,
  ActionTree
} from 'vuex'
import {
  Getters as BaseGetters,
  Mutations as BaseMutations,
  Actions as BaseActions,
  BA,
  BG,
  BM
} from './assets'
import {
  assert,
  Class,
  mapValues,
  noop,
  combine,
  traverseDescriptors,
  error,
  deprecated
} from './utils'
import { Context, Commit, Dispatch, createLazyContextPosition } from './context'
import { ComponentMapper, MappedFunction, RestArgs } from './mapper'

export interface ModuleOptions<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
> {
  namespaced?: boolean
  state?: Class<S>
  getters?: Class<G>
  mutations?: Class<M>
  actions?: Class<A>
  modules?: Record<string, Module<any, any, any, any>>
}

interface ModuleInstance {
  options: VuexModule<any, any>
  injectStore: (store: Store<any>) => void
}

export class Module<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
> {
  /* @internal */
  path: string[] | undefined

  /* @internal */
  namespace: string | undefined

  private mapper: ComponentMapper<S, G, M, A> = new ComponentMapper<S, G, M, A>(
    createLazyContextPosition(this)
  )

  constructor(public options: ModuleOptions<S, G, M, A> = {}) {}

  clone(): Module<S, G, M, A> {
    const options = { ...this.options }
    if (options.modules) {
      options.modules = mapValues(options.modules, m => m.clone())
    }
    return new Module(options)
  }

  context(store: Store<any>): Context<this> {
    return new Context(
      createLazyContextPosition(this),
      store,
      this.options.mutations,
      this.options.actions
    )
  }

  mapState<K extends keyof S>(map: K[]): { [Key in K]: () => S[Key] }
  mapState<T extends Record<string, keyof S>>(
    map: T
  ): { [Key in keyof T]: () => S[T[Key] & keyof S] }
  mapState<T extends Record<string, (state: S, getters: G) => any>>(
    map: T
  ): { [Key in keyof T]: () => ReturnType<T[Key]> }
  mapState(map: any): { [key: string]: () => any } {
    deprecated('`Module#mapState` is deprecated. Use `createMapper` instead.')
    return this.mapper.mapState(map)
  }

  mapGetters<K extends keyof G>(map: K[]): { [Key in K]: () => G[Key] }
  mapGetters<T extends Record<string, keyof G>>(
    map: T
  ): { [Key in keyof T]: () => G[T[Key] & keyof G] }
  mapGetters(map: any): { [key: string]: () => any } {
    deprecated('`Module#mapGetters` is deprecated. Use `createMapper` instead.')
    return this.mapper.mapGetters(map)
  }

  mapMutations<K extends keyof M>(
    map: K[]
  ): { [Key in K]: MappedFunction<M[Key], void> }
  mapMutations<T extends Record<string, keyof M>>(
    map: T
  ): { [Key in keyof T]: MappedFunction<M[T[Key] & keyof M], void> }
  mapMutations<
    T extends Record<string, (commit: Commit<M>, ...args: any[]) => any>
  >(
    map: T
  ): { [Key in keyof T]: (...args: RestArgs<T[Key]>) => ReturnType<T[Key]> }
  mapMutations(map: any): { [key: string]: (...args: any[]) => any } {
    deprecated(
      '`Module#mapMutations` is deprecated. Use `createMapper` instead.'
    )
    return this.mapper.mapMutations(map)
  }

  mapActions<K extends keyof A>(
    map: K[]
  ): { [Key in K]: MappedFunction<A[Key], Promise<any>> }
  mapActions<T extends Record<string, keyof A>>(
    map: T
  ): { [Key in keyof T]: MappedFunction<A[T[Key] & keyof A], Promise<any>> }
  mapActions<
    T extends Record<string, (dispatch: Dispatch<A>, ...args: any[]) => any>
  >(
    map: T
  ): { [Key in keyof T]: (...args: RestArgs<T[Key]>) => ReturnType<T[Key]> }
  mapActions(map: any): { [key: string]: (...args: any[]) => any } {
    deprecated('`Module#mapActions` is deprecated. Use `createMapper` instead.')
    return this.mapper.mapActions(map)
  }

  /* @internal */
  create(path: string[], namespace: string): ModuleInstance {
    assert(
      !this.path || this.path.join('.') === path.join('.'),
      'You are reusing one module on multiple places in the same store.\n' +
        'Clone it by `module.clone()` method to make sure every module in the store is unique.'
    )

    this.path = path
    this.namespace = namespace

    const {
      namespaced,
      state,
      getters,
      mutations,
      actions,
      modules
    } = this.options

    const children = !modules
      ? undefined
      : Object.keys(modules).reduce(
          (acc, key) => {
            const m = modules[key]
            const nextNamespaced =
              m.options.namespaced === undefined ? true : m.options.namespaced

            const nextNamespaceKey = nextNamespaced ? key + '/' : ''

            const res = m.create(
              path.concat(key),
              namespaced ? namespace + nextNamespaceKey : nextNamespaceKey
            )

            acc.options[key] = res.options
            acc.injectStore = combine(acc.injectStore, res.injectStore)

            return acc
          },
          {
            options: {} as Record<string, VuexModule<any, any>>,
            injectStore: noop as (store: Store<any>) => void
          }
        )

    const gettersInstance = getters && initGetters(getters, this)
    const mutationsInstance = mutations && initMutations(mutations, this)
    const actionsInstance = actions && initActions(actions, this)

    return {
      options: {
        namespaced: namespaced === undefined ? true : namespaced,
        state: state ? new state() : {},
        getters: gettersInstance && gettersInstance.getters,
        mutations: mutationsInstance && mutationsInstance.mutations,
        actions: actionsInstance && actionsInstance.actions,
        modules: children && children.options
      },
      injectStore: combine(
        children ? children.injectStore : noop,
        gettersInstance ? gettersInstance.injectStore : noop,
        mutationsInstance ? mutationsInstance.injectStore : noop,
        actionsInstance ? actionsInstance.injectStore : noop
      )
    }
  }
}

function initGetters<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
>(
  Getters: Class<G>,
  module: Module<S, G, M, A>
): { getters: GetterTree<any, any>; injectStore: (store: Store<any>) => void } {
  const getters: any = new Getters()
  const options: GetterTree<any, any> = {}

  // Proxy all getters to print useful warning on development
  function proxyGetters(getters: any, origin: string): any {
    const proxy = Object.create(getters)
    Object.keys(options).forEach(key => {
      Object.defineProperty(proxy, key, {
        get() {
          error(
            `You are accessing ${Getters.name}#${key} from ${Getters.name}#${origin}` +
              ' but direct access to another getter is prohibitted.' +
              ` Access it via this.getters.${key} instead.`
          )
          return getters[key]
        },
        configurable: true
      })
    })
    return proxy
  }

  traverseDescriptors(Getters.prototype, BaseGetters, (desc, key) => {
    if (typeof desc.value !== 'function' && !desc.get) {
      return
    }

    const methodFn = desc.value
    const getterFn = desc.get

    options[key] = () => {
      const proxy =
        process.env.NODE_ENV === 'production'
          ? getters
          : proxyGetters(getters, key)

      if (getterFn) {
        return getterFn.call(proxy)
      }

      if (methodFn) {
        return methodFn.bind(proxy)
      }
    }
  })

  return {
    getters: options,
    injectStore: store => {
      const context = module.context(store)

      Object.defineProperty(getters, '__ctx__', {
        get: () => context
      })

      getters.$init(store)
    }
  }
}

function initMutations<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
>(
  Mutations: Class<M>,
  module: Module<S, G, M, A>
): { mutations: MutationTree<any>; injectStore: (store: Store<any>) => void } {
  const mutations: any = new Mutations()
  const options: MutationTree<any> = {}

  // Proxy all mutations to print useful warning on development
  function proxyMutations(mutations: any, origin: string): any {
    const proxy = Object.create(mutations)
    Object.keys(options).forEach(key => {
      proxy[key] = (...args: any[]) => {
        error(
          `You are accessing ${Mutations.name}#${key} from ${Mutations.name}#${origin}` +
            ' but accessing another mutation is prohibitted.' +
            ' Use an action to consolidate the mutation chain.'
        )
        mutations[key].apply(mutations, args)
      }
    })
    return proxy
  }

  traverseDescriptors(Mutations.prototype, BaseMutations, (desc, key) => {
    if (typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => {
      const proxy =
        process.env.NODE_ENV === 'production'
          ? mutations
          : proxyMutations(mutations, key)

      return mutations[key].call(proxy, payload)
    }
  })

  return {
    mutations: options,
    injectStore: store => {
      const context = module.context(store)
      Object.defineProperty(mutations, '__ctx__', {
        get: () => context
      })
    }
  }
}

function initActions<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
>(
  Actions: Class<A>,
  module: Module<S, G, M, A>
): { actions: ActionTree<any, any>; injectStore: (store: Store<any>) => void } {
  const actions: any = new Actions()
  const options: ActionTree<any, any> = {}

  // Proxy all actions to print useful warning on development
  function proxyActions(actions: any, origin: string): any {
    const proxy = Object.create(actions)
    Object.keys(options).forEach(key => {
      proxy[key] = (...args: any[]) => {
        error(
          `You are accessing ${Actions.name}#${key} from ${Actions.name}#${origin}` +
            ' but direct access to another action is prohibitted.' +
            ` Access it via this.dispatch('${key}') instead.`
        )
        actions[key].apply(actions, args)
      }
    })
    return proxy
  }

  traverseDescriptors(Actions.prototype, BaseActions, (desc, key) => {
    if (typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => {
      const proxy =
        process.env.NODE_ENV === 'production'
          ? actions
          : proxyActions(actions, key)
      return actions[key].call(proxy, payload)
    }
  })

  return {
    actions: options,
    injectStore: store => {
      const context = module.context(store)

      Object.defineProperty(actions, '__ctx__', {
        get: () => context
      })

      actions.$init(store)
    }
  }
}
