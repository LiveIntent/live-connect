import { strEqualsIgnoreCase, expiresInHours } from 'live-connect-common'
import { WrappedStorageHandler } from './handlers/storage-handler'
import { StorageStrategies, StorageStrategy } from './model/storage-strategy'

export type CacheRecord = {
  data: string
  expiresAt?: Date
}

export interface DurableCache {
  get: (key: string) => CacheRecord | null // null is used to signal missing value
  set: (key: string, value: string, expiration?: Date) => void
}

export type StorageHandlerBackedCacheOpts = {
  strategy: 'cookie' | 'ls',
  storageHandler: WrappedStorageHandler,
  domain: string,
  defaultExpirationHours?: number
}

export type MakeCacheOpts = StorageHandlerBackedCacheOpts & {
  strategy: StorageStrategy,
}

export function makeCache(opts: MakeCacheOpts): DurableCache {
  if (!strEqualsIgnoreCase(opts.strategy, StorageStrategies.cookie) && strEqualsIgnoreCase(opts.strategy, StorageStrategies.none)) {
    return NoOpCache
  } else {
    // TODO: Remove once we validate config properly
    const strategyWithDefault = opts.strategy ?? StorageStrategies.cookie
    return new StorageHandlerBackedCache({ ...opts, strategy: strategyWithDefault })
  }
}

export class StorageHandlerBackedCache implements DurableCache {
  private handler
  private storageStrategy
  private defaultExpirationHours?
  private domain

  constructor (opts: StorageHandlerBackedCacheOpts) {
    this.handler = opts.storageHandler
    this.storageStrategy = opts.strategy
    this.defaultExpirationHours = opts.defaultExpirationHours
    this.domain = opts.domain
  }

  private getCookieRecord(key: string): CacheRecord | null {
    let expiresAt: Date | undefined

    const cookieExpirationEntry = this.handler.getCookie(expirationKey(key))
    if (cookieExpirationEntry && cookieExpirationEntry.length > 0) {
      expiresAt = new Date(cookieExpirationEntry)
      if (expiresAt <= new Date()) {
        return null
      }
    }

    const data = this.handler.getCookie(key)
    if (data) {
      return { data, expiresAt }
    } else {
      return null
    }
  }

  private getLSRecord(key: string): CacheRecord | null {
    let expiresAt: Date | undefined
    const oldLsExpirationEntry = this.handler.getDataFromLocalStorage(expirationKey(key))

    if (oldLsExpirationEntry) {
      expiresAt = new Date(oldLsExpirationEntry)
      if (expiresAt <= new Date()) {
        this.handler.removeDataFromLocalStorage(key)
        this.handler.removeDataFromLocalStorage(expirationKey(key))
        return null
      }
    }

    const data = this.handler.getDataFromLocalStorage(key)
    if (data) {
      return { data, expiresAt }
    } else {
      return null
    }
  }

  get(key: string): CacheRecord | null {
    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.localStorage) && this.handler.localStorageIsEnabled()) {
      return this.getLSRecord(key)
    } else {
      return this.getCookieRecord(key)
    }
  }

  set(key: string, value: string, expires?: Date): void {
    if (!expires && this.defaultExpirationHours) {
      expires = expiresInHours(this.defaultExpirationHours)
    }

    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.localStorage) && this.handler.localStorageIsEnabled()) {
      this.handler.setDataInLocalStorage(key, value)
      if (expires) {
        this.handler.setDataInLocalStorage(expirationKey(key), `${expires}`)
      } else {
        this.handler.removeDataFromLocalStorage(expirationKey(key))
      }
    } else {
      this.handler.setCookie(key, value, expires, 'Lax', this.domain)
      if (expires) {
        this.handler.setCookie(expirationKey(key), `${expires}`, expires, 'Lax', this.domain)
      } else {
        // sentinel value to indicate no expiration
        this.handler.setCookie(expirationKey(key), '', undefined, 'Lax', this.domain)
      }
    }
  }
}

export const NoOpCache: DurableCache = {
  get: () => null,
  set: () => undefined
}

function expirationKey(baseKey: string): string {
  return `${baseKey}_exp`
}
