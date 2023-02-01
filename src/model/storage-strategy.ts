export type StorageStrategy = 'cookie' | 'ls' | 'none' | 'disabled'

export const StorageStrategies: Record<string, StorageStrategy> = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none',
  disabled: 'disabled'
}
