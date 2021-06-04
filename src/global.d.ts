import { Store } from 'vuex'
import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<unknown>
  }
}
