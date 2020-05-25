import { Store, CommitOptions, DispatchOptions } from 'vuex'
import {
  Payload,
  Mutations as BaseMutations,
  Actions as BaseActions,
  Dispatcher,
  Committer,
} from './assets'
import { get, Class, gatherHandlerNames, assert } from './utils'
import { Module } from './module'

export interface Commit<M> {
  // type and payload separate
  <K extends keyof M>(
    type: K,
    payload: Payload<M[K]>,
    options?: CommitOptions
  ): void
  // type part of payload
  <K extends keyof M>(
    payload: Payload<M[K]> & { type: K },
    options?: CommitOptions
  ): void
  // no payload (only mutations without parameters)
  <K extends { [K in keyof M]: M[K] extends () => any ? K : never }[keyof M]>(
    type: K
  ): void
}

export interface Dispatch<A> {
  // type and payload separate
  <K extends keyof A>(
    type: K,
    payload: Payload<A[K]>,
    options?: DispatchOptions
  ): Promise<any>
  // type part of payload
  <K extends keyof A>(
    payload: Payload<A[K]> & { type: K },
    options?: DispatchOptions
  ): Promise<any>
  // no payload (only actions without parameters)
  <K extends { [K in keyof A]: A[K] extends () => any ? K : never }[keyof A]>(
    type: K
  ): Promise<any>
}

type State<Mod extends Module<any, any, any, any>> = Mod extends Module<
  infer R,
  any,
  any,
  any
>
  ? R
  : never

type Getters<Mod extends Module<any, any, any, any>> = Mod extends Module<
  any,
  infer R,
  any,
  any
>
  ? R
  : never

type Mutations<Mod extends Module<any, any, any, any>> = Mod extends Module<
  any,
  any,
  infer R,
  any
>
  ? R
  : never

type Actions<Mod extends Module<any, any, any, any>> = Mod extends Module<
  any,
  any,
  any,
  infer R
>
  ? R
  : never

export interface ContextPosition {
  path: string[]
  namespace: string
}

export function createLazyContextPosition(
  module: Module<any, any, any, any>
): ContextPosition {
  const message =
    'The module need to be registered a store before using `Module#context` or `createMapper`'

  return {
    get path() {
      assert(module.path !== undefined, message)
      return module.path!
    },

    get namespace() {
      assert(module.namespace !== undefined, message)
      return module.namespace!
    },
  }
}

function normalizedDispatch(
  dispatch: Function,
  namespace: string,
  type: any,
  payload: any,
  options?: any
): any {
  if (typeof type === 'string') {
    return dispatch(namespace + type, payload, options)
  } else {
    return dispatch(
      {
        ...type,
        type: namespace + type.type,
      },
      payload
    )
  }
}

export function commit(
  store: Store<any>,
  namespace: string,
  type: any,
  payload: any,
  options?: any
): void {
  normalizedDispatch(store.commit, namespace, type, payload, options)
}

export function dispatch(
  store: Store<any>,
  namespace: string,
  type: any,
  payload: any,
  options?: any
): Promise<any> {
  return normalizedDispatch(store.dispatch, namespace, type, payload, options)
}

export function getters(store: Store<any>, namespace: string): any {
  const sliceIndex = namespace.length
  const getters: Record<string, any> = {}

  Object.keys(store.getters).forEach((key) => {
    const sameNamespace = namespace === key.slice(0, sliceIndex)
    const name = key.slice(sliceIndex)
    if (!sameNamespace || !name) {
      return
    }

    Object.defineProperty(getters, name, {
      get: () => store.getters[key],
      enumerable: true,
    })
  })

  return getters
}

export class Context<Mod extends Module<any, any, any, any>> {
  private __mutations__?: Committer<Mutations<Mod>>
  private __actions__?: Dispatcher<Actions<Mod>>
  /** @internal */
  constructor(
    private pos: ContextPosition,
    private store: Store<any>,
    private mutationsClass: Class<unknown> | undefined,
    private actionsClass: Class<unknown> | undefined
  ) {}

  get mutations(): Committer<Mutations<Mod>> {
    if (this.__mutations__) {
      return this.__mutations__
    }
    const mutations: Record<string, any> = {}
    if (this.mutationsClass) {
      const mutationNames = gatherHandlerNames(
        this.mutationsClass.prototype,
        BaseMutations
      )
      mutationNames.forEach((name) => {
        Object.defineProperty(mutations, name, {
          value: (payload: any) => this.commit(name, payload),
          enumerable: true,
        })
      })
    }
    return (this.__mutations__ = mutations as any)
  }

  get actions(): Dispatcher<Actions<Mod>> {
    if (this.__actions__) {
      return this.__actions__
    }
    const actions: Record<string, any> = {}
    if (this.actionsClass) {
      const actionNames = gatherHandlerNames(
        this.actionsClass.prototype,
        BaseActions
      )
      actionNames.forEach((name) => {
        Object.defineProperty(actions, name, {
          value: (payload: any) => this.dispatch(name, payload),
          enumerable: true,
        })
      })
    }
    return (this.__actions__ = actions as any)
  }

  commit: Commit<Mutations<Mod>> = (
    type: any,
    payload?: any,
    options?: any
  ): void => {
    return commit(this.store, this.pos.namespace, type, payload, options)
  }

  dispatch: Dispatch<Actions<Mod>> = (
    type: any,
    payload?: any,
    options?: any
  ): any => {
    return dispatch(this.store, this.pos.namespace, type, payload, options)
  }

  get state(): State<Mod> {
    return get(this.pos.path, this.store.state)
  }

  get getters(): Getters<Mod> {
    return getters(this.store, this.pos.namespace)
  }
}
