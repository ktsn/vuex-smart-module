import { Store } from 'vuex'
import { Commit, Dispatch, Context } from './context'
import { Module } from './module'
import { MappedFunction } from './mapper'

interface Class<T> {
  new (...args: any[]): T
}

type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

export function inject<G extends Getters<S>, S>(
  Getters: Class<G>,
  injection: DeepPartial<G & { state: S; getters: G }>
): G

export function inject<M extends Mutations<S>, S>(
  Mutations: Class<M>,
  injection: DeepPartial<M & { state: S }>
): M

export function inject<
  A extends Actions<S, G, M, A>,
  S,
  G extends BG<S>,
  M extends BM<S>
>(
  Actions: Class<A>,
  injection: DeepPartial<
    A & {
      state: S
      getters: G
      dispatch: any
      commit: any
      mutations: M
      actions: A
    }
  >
): A

export function inject<T>(
  F: Class<T>,
  injection: DeepPartial<T> & Record<string, any>
): T {
  const proto = F.prototype

  const descs: PropertyDescriptorMap = {}
  Object.keys(injection).forEach((key) => {
    descs[key] = {
      configurable: true,
      enumerable: true,
      writable: true,
      value: injection[key],
    }
  })

  return Object.create(proto, descs)
}

export class Getters<S = {}> {
  /* @internal */
  __ctx__!: Context<Module<S, this, any, any, any>>

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
  __ctx__!: Context<Module<S, any, any, any, any>>

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
  __ctx__!: Context<Module<S, G, M, any, any>>

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

  /**
   * IMPORTANT: Each action type maybe incorrect - return type of all actions should be `Promise<any>`
   * but the ones under `actions` are same as what you declared in this actions class.
   * The reason why we declare the type in such way is to avoid recursive type error.
   * See: https://github.com/ktsn/vuex-smart-module/issues/30
   */
  protected get actions(): A {
    return (this.__ctx__.actions as unknown) as A
  }

  protected get mutations(): Committer<M> {
    return this.__ctx__.mutations
  }
}

export type Committer<M> = {
  [K in keyof M]: Payload<M[K]> extends never
    ? never
    : MappedFunction<M[K], void>
}

export type Dispatcher<A> = {
  [K in keyof A]: Payload<A[K]> extends never
    ? never
    : MappedFunction<A[K], Promise<any>>
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
