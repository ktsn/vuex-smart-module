import { Store } from 'vuex'
import { Commit, Dispatch, Context } from './context'
import { Module } from './module'

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
