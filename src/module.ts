import { Store, Module as VuexModule, GetterTree, MutationTree } from 'vuex'
import { BG0, BM0, BA0 } from './assets'
import { assert, Class, mapValues } from './utils'
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
  create(
    getStore: () => Store<any>, // hacky way to get store object lazily...
    path: string[],
    namespace: string
  ): VuexModule<any, any> {
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

    return {
      namespaced: namespaced === undefined ? true : namespaced,
      state: state ? new state() : {},
      getters: getters ? initGetters(getters, this, getStore) : {},
      mutations: mutations ? initMutations(mutations, this, getStore) : {},
      actions: actions ? initActions(actions, this, getStore) : {},
      modules: !modules
        ? undefined
        : mapValues(modules, (m, key) => {
            const nextNamespaced =
              m.options.namespaced === undefined ? true : m.options.namespaced

            const nextNamespaceKey = nextNamespaced ? key + '/' : ''

            return m.create(
              getStore,
              path.concat(key),
              namespaced ? namespace + nextNamespaceKey : nextNamespaceKey
            )
          })
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
  module: Module<S, G, M, A>,
  getStore: () => Store<any>
): GetterTree<any, any> {
  const getters: any = new Getters()
  Object.defineProperty(getters, '__ctx__', {
    get: () => module.context(getStore())
  })

  const options: GetterTree<any, any> = {}

  Object.getOwnPropertyNames(Getters.prototype).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(Getters.prototype, key)
    if (!desc || (typeof desc.value !== 'function' && !desc.get)) {
      return
    }

    options[key] = () => {
      const res = getters[key]
      return typeof res === 'function' ? res.bind(getters) : res
    }
  })

  return options
}

function initMutations<S, G extends BG0, M extends BM0, A extends BA0>(
  Mutations: Class<M>,
  module: Module<S, G, M, A>,
  getStore: () => Store<any>
): MutationTree<any> {
  const mutations: any = new Mutations()
  Object.defineProperty(mutations, '__ctx__', {
    get: () => module.context(getStore())
  })

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
  module: Module<S, G, M, A>,
  getStore: () => Store<any>
): MutationTree<any> {
  const actions: any = new Actions()
  Object.defineProperty(actions, '__ctx__', {
    get: () => module.context(getStore())
  })

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
