import Vue from 'vue'
import {
  ContextPosition,
  getters as namespacedGetters,
  commit as namespacedCommit,
  dispatch as namespacedDispatch,
  Commit,
  Dispatch,
  createLazyContextPosition,
} from './context'
import { mapValues, get } from './utils'
import { Module } from './module'
import { BG, BM, BA, Payload } from './assets'

export type MappedFunction<Fn, R> = undefined extends Payload<Fn>
  ? (payload?: Payload<Fn>) => R
  : (payload: Payload<Fn>) => R

export type RestArgs<Fn> = Fn extends (_: any, ...args: infer R) => any
  ? R
  : never

export function createMapper<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
>(module: Module<S, G, M, A, any>): ComponentMapper<S, G, M, A> {
  return new ComponentMapper(createLazyContextPosition(module))
}

export class ComponentMapper<
  S,
  G extends BG<S>,
  M extends BM<S>,
  A extends BA<S, G, M>
> {
  constructor(private pos: ContextPosition) {}

  mapState<K extends keyof S>(map: K[]): { [Key in K]: () => S[Key] }
  mapState<T extends Record<string, keyof S>>(
    map: T
  ): { [Key in keyof T]: () => S[T[Key] & keyof S] }
  mapState<T extends Record<string, (state: S, getters: G) => any>>(
    map: T
  ): { [Key in keyof T]: () => ReturnType<T[Key]> }
  mapState(map: any): { [key: string]: () => any } {
    const pos = this.pos

    return createMappedObject(map, (value) => {
      return function mappedStateComputed(this: Vue) {
        const state = get(pos.path, this.$store.state)

        if (typeof value === 'function') {
          const getters = namespacedGetters(this.$store, pos.namespace)
          return value.call(this, state, getters)
        } else {
          return state[value]
        }
      }
    })
  }

  mapGetters<K extends keyof G>(map: K[]): { [Key in K]: () => G[Key] }
  mapGetters<T extends Record<string, keyof G>>(
    map: T
  ): { [Key in keyof T]: () => G[T[Key] & keyof G] }
  mapGetters(map: any): { [key: string]: () => any } {
    const pos = this.pos

    return createMappedObject(map, (value) => {
      function mappedGetterComputed(this: Vue) {
        return this.$store.getters[pos.namespace + value]
      }

      // mark vuex getter for devtools
      mappedGetterComputed.vuex = true

      return mappedGetterComputed
    })
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
    const pos = this.pos

    return createMappedObject(map, (value) => {
      return function mappedMutationMethod(this: Vue, ...args: any[]) {
        const commit = (type: any, payload: any) => {
          return namespacedCommit(this.$store, pos.namespace, type, payload)
        }

        return typeof value === 'function'
          ? value.apply(this, [commit].concat(args))
          : commit(value, args[0])
      }
    })
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
    const pos = this.pos

    return createMappedObject(map, (value) => {
      return function mappedActionMethod(this: Vue, ...args: any[]) {
        const dispatch = (type: any, payload: any) => {
          return namespacedDispatch(this.$store, pos.namespace, type, payload)
        }

        return typeof value === 'function'
          ? value.apply(this, [dispatch].concat(args))
          : dispatch(value, args[0])
      }
    })
  }
}

function createMappedObject(
  map: string[] | Record<string, any>,
  fn: (value: any) => any
): Record<string, any> {
  const normalized = !Array.isArray(map)
    ? map
    : map.reduce<Record<string, string>>((acc, key) => {
        acc[key] = key
        return acc
      }, {})
  return mapValues(normalized, fn)
}
