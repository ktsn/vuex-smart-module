import { Store } from 'vuex'
import { Commit, Dispatch, Context } from './context'
import { Module } from './module'

interface Class<T> {
  new (...args: any[]): T
}

export function inject<G extends Getters<S>, S>(
  Getters: Class<G>,
  injection: Partial<G & { state: S; getters: G }>
): G
export function inject<M extends Mutations<S>, S>(
  Mutations: Class<M>,
  injection: Partial<M & { state: S }>
): M
export function inject<A extends Actions<S, G, any, any>, S, G extends BG<S>>(
  Actions: Class<A>,
  injection: Partial<A & { state: S; getters: G; dispatch: any; commit: any }>
): A
export function inject<T>(
  F: Class<T>,
  injection: Partial<T> & Record<string, any>
): T {
  const proto = F.prototype

  const descs: PropertyDescriptorMap = {}
  Object.keys(injection).forEach(key => {
    descs[key] = {
      configurable: true,
      enumerable: true,
      writable: true,
      value: injection[key]
    }
  })

  return Object.create(proto, descs)
}

export class Getters<S = {}> {
  /* @internal */
  __ctx__!: Context<Module<S, this, any, any>>

  $init(_store: Store<any>): void {}

  protected get state(): S {
    return this.__ctx__.state
  }

  protected get getters(): this {
    return this.__ctx__.getters
  }
}

export class Mutations<S = {}> {
  /* @internal */
  __ctx__!: Context<Module<S, any, any, any>>

  protected get state(): S {
    return this.__ctx__.state
  }
}

export class Actions<
  S = {},
  G extends BG<S> = BG<S>,
  M extends BM<S> = BM<S>,
  A = {} // We need to specify self action type explicitly to infer dispatch type.
> {
  /* @internal */
  __ctx__!: Context<Module<S, G, M, any>>

  $init(_store: Store<any>): void {}

  protected get state(): S {
    return this.__ctx__.state
  }

  protected get getters(): G {
    return this.__ctx__.getters
  }

  protected get commit(): Commit<M> {
    return this.__ctx__.commit
  }

  protected get dispatch(): Dispatch<A> {
    return this.__ctx__.dispatch
  }
}

// Type aliases for internal use
export type BG<S> = Getters<S>
export type BM<S> = Mutations<S>
export type BA<S, G extends BG<S>, M extends BM<S>> = Actions<S, G, M>

export type Payload<T> = T extends (payload?: infer P) => any
  ? P | undefined
  : T extends (payload: infer P) => any
  ? P
  : never
