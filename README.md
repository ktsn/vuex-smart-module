# vuex-smart-module

Type safe Vuex module with powerful module features. The basic API idea is brought from [Sinai](https://github.com/ktsn/sinai).

## Features

- Completely type safe when used with TypeScript without redundancy.
- Provide a smart way to use modules.
- Canonical Vuex-like API as possible.

## Installation

```bash
$ npm install vuex-smart-module
```

TypeScript >= 3.6 is required.

## Usage

**All examples are written in TypeScript**

You create a module with class syntax:

```ts
// store/modules/foo.ts

// Import base classes
import { Getters, Mutations, Actions, Module } from 'vuex-smart-module'

// State
class FooState {
  count = 1
}

// Getters
// Extend 'Getters' class with 'FooState' type
class FooGetters extends Getters<FooState> {
  // You can declare both getter properties or methods
  get double() {
    // Getters instance has 'state' property
    return this.state.count * 2
  }

  get triple() {
    // When you want to use another getter, there is `getters` property
    return this.getters.double + this.state.count
  }
}

// Mutations
// Extend 'Mutations' class with 'FooState' type
class FooMutations extends Mutations<FooState> {
  increment(payload: number) {
    // Mutations instance has 'state' property.
    // You update 'this.state' by mutating it.
    this.state.count += payload
  }
}

// Actions
// Extend 'Actions' class with other module asset types
// Note that you need to specify self action type (FooActions) as a type parameter explicitly
class FooActions extends Actions<
  FooState,
  FooGetters,
  FooMutations,
  FooActions
> {
  incrementAsync(payload: { amount: number; interval: number }) {
    // Actions instance has 'state', 'getters', 'commit' and 'dispatch' properties

    return new Promise(resolve => {
      setTimeout(() => {
        this.commit('increment', payload.amount)
      }, payload.interval)
    })
  }
}

// Create a module with module asset classes
export const foo = new Module({
  state: FooState,
  getters: FooGetters,
  mutations: FooMutations,
  actions: FooActions
})
```

Then, create Vuex store instance by using `createStore` function from `vuex-smart-module`:

```ts
// store/index.ts

import Vue from 'vue'
import * as Vuex from 'vuex'
import { createStore, Module } from 'vuex-smart-module'
import { foo } from './modules/foo'

Vue.use(Vuex)

// The 1st argument is root module.
// Vuex store options should be passed to the 2nd argument.
export const store = createStore(
  // Root module
  foo,

  // Vuex store options
  {
    strict: process.env.NODE_ENV !== 'production'
  }
)
```

The created store is a traditional instance of Vuex store - you can use it in the same manner.

```ts
// main.ts

import Vue from 'vue'
import { store } from './store'
import App from './App.vue'

new Vue({
  el: '#app',
  store,
  render: h => h(App)
})
```

### Nested Modules

You can create a nested module as same as Vuex by passing a module object to another module's `modules` option.

```ts
import { Getters, Module, createStore } from 'vuex-smart-module'

class NestedState {
  value = 'hello'
}

class NestedGetters extends Getters<NestedState> {
  greeting(name: string): string {
    return this.state.value + ', ' + name
  }
}

const nested = new Module({
  state: NestedState,
  getters: NestedGetters
})

const root = new Module({
  modules: {
    nested
  }
})

const store = createStore(root)

console.log(store.state.nested.value) // -> hello
console.log(store.getters['nested/greeting']('John')) // -> hello, John
```

Nested modules will be [namespaced module](https://vuex.vuejs.org/guide/modules.html#namespacing) by default. If you do not want a module to be a namespaced, pass the `namespaced: false` option to the module's constructor options.

```ts
import { Getters, Module, createStore } from 'vuex-smart-module'

class NestedState {
  value = 'hello'
}

class NestedGetters extends Getters<NestedState> {
  greeting(name: string): string {
    return this.state.value + ', ' + name
  }
}

const nested = new Module({
  // nested module will not be namespaced
  namespaced: false

  state: NestedState,
  getters: NestedGetters
})

const root = new Module({
  modules: {
    nested
  }
})

const store = createStore(root)

console.log(store.state.nested.value) // -> hello
console.log(store.getters.greeting('John')) // -> hello, John
```

### Module Lifecycle and Dependencies

Getters and actions class can have a special method `$init` which will be called after the module is initialized in a store. The `$init` hook receives the store instance as the 1st argument. You can pick some external dependencies from it. The following is an example for [Nuxt](https://nuxtjs.org/) + [Axios Module](https://axios.nuxtjs.org/).

```ts
import { Store } from 'vuex'
import { Actions } from 'vuex-smart-module'

class FooActions extends Actions {
  // Declare dependency type
  store: Store<any>

  // Called after the module is initialized
  $init(store: Store<any>): void {
    // Retain store instance for later
    this.store = store
  }

  async fetch(): Promise<void> {
    console.log(await this.store.$axios.$get('...'))
  }
}
```

In case of you want to use another module in some module, you can create a module context.

```ts
import { Store } from 'vuex'
import { Getters, Actions, Module, Context } from 'vuex-smart-module'

// Foo module
class FooState {
  value = 'hello'
}

const foo = new Module({
  state: FooState
})

// Bar module (using foo module in getters and actions)
class BarGetters extends Getters {
  // Declare context type
  foo: Context<typeof foo>

  // Called after the module is initialized
  $init(store: Store<any>): void {
    // Create and retain foo module context
    this.foo = foo.context(store)
  }

  get excited(): string {
    return this.foo.state.value + '!' // -> hello!
  }
}

class BarActions extends Actions {
  // Declare context type
  foo: Context<typeof foo>

  // Called after the module is initialized
  $init(store: Store<any>): void {
    // Create and retain foo module context
    this.foo = foo.context(store)
  }

  print(): void {
    console.log(this.foo.state.value) // -> hello
  }
}

const bar = new Module({
  getters: BarGetters,
  actions: BarActions
})

// Make sure to have all modules in the store
const root = new Module({
  modules: {
    foo,
    bar
  }
})

const store = createStore(root)
```

### Register Module Dynamically

You can use `registerModule` to register a module and `unregisterModule` to unregister it.

```ts
import { registerModule, unregisterModule } from 'vuex-smart-module'
import { store } from './store'
import { foo } from './store/modules/foo'

// register module
registerModule(
  store, // store instance
  ['foo'], // module path. can be string or array of string
  'foo/', // namespace string which will be when put into the store
  foo, // module instance

  // module options as same as vuex registerModule
  {
    preserveState: true
  }
)

// unregister module
unregisterModule(
  store, // store instance
  foo // module instance which you want to unregister
)
```

Note that the 3rd argument of `registerModule`, which is the namespace string, must match with the actual namespace that the store resolves. If you pass the wrong namespace to it, component mappers and context api would not work correctly.

### Component Mapper

You can generate `mapXXX` helpers, which are the same interface as Vuex ones, for each associated module by using the `createMapper` function. The mapped computed properties and methods are strictly typed. So you will not have some typo or pass wrong payloads to them.

```ts
// @/store/modules/foo
import { Module, createMapper } from 'vuex-smart-module'

// Create module
export const foo = new Module({
  // ...
})

// Create mapper
export const fooMapper = createMapper(foo)
```

```ts
import Vue from 'vue'

// Import foo mapper
import { fooMapper } from '@/store/modules/foo'

export default Vue.extend({
  computed: fooMapper.mapGetters(['double']),

  methods: fooMapper.mapActions({
    incAsync: 'incrementAsync'
  }),

  created() {
    console.log(this.double)
    this.incAsync(undefined)
  }
})
```

### Method Style Access for Actions and Mutations

`this` in an action and a module context have `actions` and `mutations` properties. They contains module actions and mutations in method form. You can use them instead of `dispatch` or `commit` if you prefer method call style over event emitter style.

The method style has several advantages: you can use _Go to definition_ for your actions and mutations and it prints simple and easier to understand errors if you pass a wrong payload type, for example.

Example usage in an action:

```ts
import { Actions } from 'vuex-smart-module'

class FooActions extends Actions<FooState, FooGetters, FooMutations, FooActions> {
  increment(amount: number)
    // Call `increment` mutation
    this.mutations.increment(payload)
  }
}
```

Example usage via a context:

```ts
import Vue from 'vue'

// Import foo module
import { foo } from '@/store/modules/foo'

export default Vue.extend({
  mounted() {
    const ctx = foo.context(this.store)

    // Call `increment` action
    ctx.actions.increment(1)
  }
})
```

## Testing

### Unit testing getters, mutations and actions

vuex-smart-module provides the `inject` helper function which allows you to inject mock dependencies into getters, mutations and actions instances. You can inject any properties for test:

```ts
import { inject } from 'vuex-smart-module'
import { FooGetters, FooActions } from '@/store/modules/foo'

it('returns doubled value', () => {
  // Inject mock state into getters
  const getters = inject(FooGetters, {
    state: {
      count: 5
    }
  })

  // Test double getter
  expect(getters.double).toBe(10)
})

it('increments asynchronously', async () => {
  // Inject mock commit method
  const commit = jest.fn()
  const actions = inject(FooActions, {
    commit
  })

  await actions.incrementAsync({
    amount: 3
    interval: 1
  })

  // Check mock commit method is called
  expect(commit).toHaveBeenCalledWith('increment', 3)
})
```

### Mocking modules to test components

When you want to mock some module assets, you can directly inject a mock constructor into the module options. For example, you will test the following component which is using the `counter` module:

```vue
<template>
  <button @click="increment">Increment</button>
</template>

<script lang="ts">
import Vue from 'vue'

// use counter Mapper
import { counterMapper } from '@/store/modules/counter'

export default Vue.extend({
  methods: counterMapper.mapMutations(['increment'])
})
</script>
```

In the spec file, mock the `mutations` option in the `counter` module. The below is a [Jest](https://jestjs.io/) example but the essential idea holds true for many test frameworks:

```ts
import * as Vuex from 'vuex'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import { createStore } from 'vuex-smart-module'

// component which we want to test
import Counter from '@/components/Counter.vue'

// counter module which we want to mock
import counter, { CounterMutations } from '@/store/modules/counter'

const localVue = createLocalVue()
localVue.use(Vuex)

// make sure that you clean mocked object after each test case
const originalMutations = counter.options.mutations
afterEach(() => {
  counter.options.mutations = originalMutations
})

it('calls increment mutation', () => {
  // create spy
  const spy = jest.fn()

  // create mock mutation
  class MockMutations extends CounterMutations {
    // override increment method for mock
    increment() {
      spy()
    }
  }

  // inject mock
  counter.options.mutations = MockMutations

  // create mock store
  const store = createStore(counter)

  // emulate click event
  shallowMount(Counter, { store, localVue }).trigger('click')

  // check the mock function was called
  expect(spy).toHaveBeenCalled()
})
```

### Mocking nested modules and dependencies

Using dependencies and nested module contexts in Actions requires to mock them in tests.

So you test the following Actions class that has been constructed as described in the section above:

```ts
import { Store } from 'vuex'
import { Actions } from 'vuex-smart-module'

class FooActions extends Actions {
  // Declare dependency type
  private store!: Store<FooState>
  private bar!: Context<typeof bar>

  // Called after the module is initialized
  $init(store: Store<FooState>): void {
    // Retain store instance for later
    this.store = store
    this.bar = bar.context(store)
  }

  async fetch(): Promise<void> {
    console.log(await this.store.$axios.$get('...'))
    this.bar.dispatch(...)
  }
}
```

Then the Jest spec file would be written as:

```ts
import { inject } from 'vuex-smart-module'
import { FooActions } from '@/store/modules/foo'

describe('FooActions', () => {
  it('calls the dependency and dispatches the remote action', async () => {
    const actions = inject(FooActions, {})
    const axiosGet = jest.fn()
    const barDispatch = jest.fn()

    // @ts-ignore
    actions.store = {
      $axios: {
        $get: axiosGet
      }
    }

    // @ts-ignore
    actions.bar = {
      dispatch: barDispatch
    }

    await actions.fetch()

    expect(axiosGet).toHaveBeenCalledWith(...)
    expect(barDispatch).toHaveBeenCalledWith(...)
  })
})
```

## License

MIT
