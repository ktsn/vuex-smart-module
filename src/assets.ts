import { Commit, Dispatch, Context } from './context'
import { Module } from './module'

export class Getters<S = {}> {
  /* @internal */
  __ctx__!: Context<Module<S, this, BM0, BA0>>

  protected get state(): S {
    return this.__ctx__.state
  }

  protected get getters(): this {
    return this.__ctx__.getters
  }
}

export class Mutations<S = {}> {
  /* @internal */
  __ctx__!: Context<Module<S, BG0, BM0, BA0>>

  protected get state(): S {
    return this.__ctx__.state
  }
}

export class Actions<
  S = {},
  G extends BG0 = Getters,
  M extends BM0 = Mutations,
  A = {} // We need to specify self action type explicitly to infer dispatch type.
> {
  /* @internal */
  __ctx__!: Context<Module<S, G, M, any>>

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
export type BG0 = Getters
export type BG1<S> = Getters<S>
export type BM0 = Mutations
export type BA0 = Actions
export type BA1<S, G extends BG0, M extends BM0> = Actions<S, G, M>

export type Payload<T> = T extends () => any
  ? undefined
  : T extends (payload: infer P) => any
  ? P
  : never
