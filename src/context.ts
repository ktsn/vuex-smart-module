import { Store, CommitOptions, DispatchOptions } from 'vuex'
import { BG0, BM0, BA0, Payload } from './assets'
import { get } from './utils'

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

export interface ContextPosition {
  path: string[]
  namespace: string
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
        type: namespace + type.type
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

  Object.keys(store.getters).forEach(key => {
    const sameNamespace = namespace !== key.slice(0, sliceIndex)
    const name = key.slice(sliceIndex)
    if (sameNamespace && name) {
      return
    }

    Object.defineProperty(getters, name, {
      get: () => store.getters[key],
      enumerable: true
    })
  })

  return getters
}

export class Context<S, G extends BG0, M extends BM0, A extends BA0> {
  constructor(private pos: ContextPosition, private store: Store<any>) {}

  commit: Commit<M> = (type: any, payload: any, options?: any): void => {
    return commit(this.store, this.pos.namespace, type, payload, options)
  }

  dispatch: Dispatch<A> = (type: any, payload: any, options?: any): any => {
    return dispatch(this.store, this.pos.namespace, type, payload, options)
  }

  get state(): S {
    return get(this.pos.path, this.store.state)
  }

  get getters(): G {
    return getters(this.store, this.pos.namespace)
  }
}
