import {
  Store,
  Module as VuexModule,
  GetterTree,
  MutationTree,
  ActionTree
} from 'vuex'
import { BG0, BM0, BA0 } from './assets'
import { assert, Class, mapValues, noop, combine } from './utils'
import { Context, ContextPosition } from './context'
import { ComponentMapper } from './mapper'

export interface ModuleOptions<S, G extends BG0, M extends BM0, A extends BA0> {
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

export class Module<S, G extends BG0, M extends BM0, A extends BA0> {
  /* @internal */
  path: string[] | undefined

  /* @internal */
  namespace: string | undefined

  constructor(private options: ModuleOptions<S, G, M, A> = {}) {}

  clone(): Module<S, G, M, A> {
    const options = { ...this.options }
    if (options.modules) {
      options.modules = mapValues(options.modules, m => m.clone())
    }
    return new Module(options)
  }

  context(store: Store<any>): Context<this> {
    return new Context(createLazyContextPosition(this), store)
  }

  componentMapper(): ComponentMapper<S, G, M, A> {
    return new ComponentMapper(createLazyContextPosition(this))
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

function createLazyContextPosition(
  module: Module<any, any, any, any>
): ContextPosition {
  const message =
    'The module need to be registered a store before using `context` or `componentMapper`'

  return {
    get path() {
      assert(module.path !== undefined, message)
      return module.path!
    },

    get namespace() {
      assert(module.namespace !== undefined, message)
      return module.namespace!
    }
  }
}

function initGetters<S, G extends BG0, M extends BM0, A extends BA0>(
  Getters: Class<G>,
  module: Module<S, G, M, A>
): { getters: GetterTree<any, any>; injectStore: (store: Store<any>) => void } {
  const getters = new Getters()
  const options: GetterTree<any, any> = {}

  Object.getOwnPropertyNames(Getters.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Getters.prototype, key)
    if (!desc || (typeof desc.value !== 'function' && !desc.get)) {
      return
    }

    options[key] = () => {
      const res = (getters as any)[key]
      return typeof res === 'function' ? res.bind(getters) : res
    }
  })

  return {
    getters: options,
    injectStore: store => {
      const context = module.context(store)

      Object.defineProperty(getters, '__ctx__', {
        get: () => context
      })

      getters.$created(store)
    }
  }
}

function initMutations<S, G extends BG0, M extends BM0, A extends BA0>(
  Mutations: Class<M>,
  module: Module<S, G, M, A>
): { mutations: MutationTree<any>; injectStore: (store: Store<any>) => void } {
  const mutations = new Mutations()
  const options: MutationTree<any> = {}

  Object.getOwnPropertyNames(Mutations.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Mutations.prototype, key)
    if (!desc || typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => (mutations as any)[key](payload)
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

function initActions<S, G extends BG0, M extends BM0, A extends BA0>(
  Actions: Class<A>,
  module: Module<S, G, M, A>
): { actions: ActionTree<any, any>; injectStore: (store: Store<any>) => void } {
  const actions = new Actions()
  const options: ActionTree<any, any> = {}

  Object.getOwnPropertyNames(Actions.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Actions.prototype, key)
    if (!desc || typeof desc.value !== 'function') {
      return
    }

    options[key] = (_: any, payload: any) => (actions as any)[key](payload)
  })

  return {
    actions: options,
    injectStore: store => {
      const context = module.context(store)

      Object.defineProperty(actions, '__ctx__', {
        get: () => context
      })

      actions.$created(store)
    }
  }
}
