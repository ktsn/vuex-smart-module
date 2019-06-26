export interface Class<T> {
  new (...args: any[]): T
}

export const noop = () => {}

export function combine<T>(...fs: ((x: T) => void)[]): (x: T) => void {
  return x => {
    fs.forEach(f => f(x))
  }
}

export function get<T = any>(path: string[], value: any): T {
  return path.reduce((acc, key) => {
    return acc[key]
  }, value)
}

export function mapValues<T, R>(
  record: Record<string, T>,
  fn: (value: T, key: string) => R
): Record<string, R> {
  const res: Record<string, R> = {}
  Object.keys(record).forEach(key => {
    res[key] = fn(record[key], key)
  })
  return res
}

export function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`[vuex-smart-module] ${message}`)
  }
}

export function traverseDescriptors(
  proto: Object,
  Base: Function,
  fn: (desc: PropertyDescriptor, key: string) => void,
  exclude: Record<string, boolean> = { constructor: true }
): void {
  if (proto.constructor === Base) {
    return
  }

  Object.getOwnPropertyNames(proto).forEach(key => {
    // Ensure to only choose most extended properties
    if (exclude[key]) return
    exclude[key] = true

    const desc = Object.getOwnPropertyDescriptor(proto, key)!
    fn(desc, key)
  })

  traverseDescriptors(Object.getPrototypeOf(proto), Base, fn, exclude)
}

export function gatherHandlerNames(proto: Object, Base: Function): string[] {
  const ret: string[] = []
  traverseDescriptors(proto, Base, (desc, name) => {
    if (typeof desc.value !== 'function') {
      return
    }
    ret.push(name)
  })
  return ret
}
