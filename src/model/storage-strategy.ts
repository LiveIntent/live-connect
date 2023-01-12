import { StorageStrategyMode } from '../types'

const StorageStrategy: Record<string, StorageStrategyMode> = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none',
  disabled: 'disabled'
}

export { StorageStrategy }
