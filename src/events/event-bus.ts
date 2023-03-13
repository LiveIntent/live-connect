// @ts-nocheck
import { localBus, windowAttachedBus } from 'live-connect-common'
import { EventBus } from '../types'

export function LocalEventBus(size = 5) {
  return localBus(size)
}

export function GlobalEventBus(name: string, size: number, errorCallback: (error: unknown) => void): EventBus {
  return windowAttachedBus(name, size, errorCallback)
}
