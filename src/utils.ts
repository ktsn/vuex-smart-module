export interface Class<T> {
  new (...args: any[]): T
}

export function get<T = any>(path: string[], value: any): T {
  return path.reduce((acc, key) => {
    return acc[key]
  }, value)
}

export function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`[vuex-smart-module] ${message}`)
  }
}
