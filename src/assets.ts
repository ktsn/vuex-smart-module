import { Class } from './utils'
import { Module, Commit } from './module'

export class BG<S> {
  /* @internal */
  __module__!: Module<S, BG0, BM0, BA0>

  protected get state(): S {
    return this.__module__.state
  }
}

export class BM<S> {
  /* @internal */
  __module__!: Module<S, BG0, BM0, BA0>

  protected get state(): S {
    return this.__module__.state
  }
}

export class BA<S, G extends BG0, M extends BM0> {
  /* @internal */
  __module__!: Module<S, G, M, BA0>

  protected get state(): S {
    return this.__module__.state
  }

  protected get getters(): G {
    return this.__module__.getters
  }

  protected get commit(): Commit<M> {
    return this.__module__.commit
  }
}

export type BG0 = BG<{}>
export type BG1<S> = BG<S>
export type BM0 = BM<{}>
export type BA0 = BA<{}, BG0, BM0>
export type BA1<S, G extends BG0, M extends BM0> = BA<S, G, M>

export type Payload<T> = T extends () => any
  ? undefined
  : T extends (payload: infer P) => any ? P : never

export function Getters<S>(): Class<BG1<S>>
export function Getters(): Class<BG0> {
  return BG
}

export function Mutations<S>(): Class<BM<S>>
export function Mutations(): Class<BM0> {
  return BM
}

export function Actions<G extends BG0>(): Class<BA1<{}, G, BM0>>
export function Actions<M extends BM0>(): Class<BA1<{}, BG0, M>>
export function Actions<S>(): Class<BA1<S, BG0, BM0>>
export function Actions<S, G extends BG0>(): Class<BA1<S, G, BM<S>>>
export function Actions<S, M extends BM0>(): Class<BA1<S, BG1<S>, M>>
export function Actions<S, G extends BG0, M extends BM0>(): Class<BA1<S, G, M>>
export function Actions(): Class<BA0> {
  return BA
}
