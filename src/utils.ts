export interface Class<T> {
  new (...args: any[]): T
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
