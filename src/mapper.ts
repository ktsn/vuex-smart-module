import Vue from 'vue'
import {
  ContextPosition,
  getters as namespacedGetters,
  commit as namespacedCommit,
  dispatch as namespacedDispatch
} from './context'
import { mapValues, get } from './utils'

export class ComponentMapper {
  constructor(private pos: ContextPosition) {}

  mapState(map: any): { [key: string]: () => any } {
    const pos = this.pos

    return createMappedObject(map, value => {
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

  mapGetters(map: any): { [key: string]: () => any } {
    const pos = this.pos

    return createMappedObject(map, value => {
      function mappedGetterComputed(this: Vue) {
        return this.$store.getters[pos.namespace + value]
      }

      // mark vuex getter for devtools
      mappedGetterComputed.vuex = true

      return mappedGetterComputed
    })
  }

  mapMutations(map: any): { [key: string]: (...args: any[]) => any } {
    const pos = this.pos

    return createMappedObject(map, value => {
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

  mapActions(map: any): { [key: string]: (...args: any[]) => any } {
    const pos = this.pos

    return createMappedObject(map, value => {
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
