import { expiresInHours, EventBus, isObject } from 'live-connect-common'
import { WrappedStorageHandler } from './handlers/storage-handler'

export type RecordMetadata = {
  expiresAt?: Date
  writtenAt: Date
}

export type CacheRecord = {
  data: string
  meta: RecordMetadata
}

export class ParseError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export interface DurableCache {
  get: (key: string) => CacheRecord | null // null is used to signal missing value
  set: (key: string, value: string, expiration?: Date) => void
}

export type StorageHandlerBackedCacheArgs = {
  storageHandler: WrappedStorageHandler,
  eventBus: EventBus,
  domain: string,
  defaultExpirationHours?: number
}

export class StorageHandlerBackedCache implements DurableCache {
  private handler
  private defaultExpirationHours?
  private domain
  private eventBus

  constructor (opts: StorageHandlerBackedCacheArgs) {
    this.handler = opts.storageHandler
    this.defaultExpirationHours = opts.defaultExpirationHours
    this.domain = opts.domain
    this.eventBus = opts.eventBus
  }

  private deleteCookie(key: string): void {
    this.handler.setCookie(key, '', new Date(0), 'Lax', this.domain)
  }

  private parseMetaRecord(serialized: string): RecordMetadata | null {
    const meta = JSON.parse(serialized)
    if (!isObject(meta)) {
      throw new ParseError('Meta record is not an object')
    }

    let expiresAt
    if ('expiresAt' in meta) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresAt = new Date(meta.expiresAt as any)
      if (isNaN(expiresAt.getTime())) {
        throw new ParseError('Invalid expiresAt')
      }
    }

    if (!('writtenAt' in meta)) {
      throw new ParseError('Missing writtenAt')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const writtenAt = new Date(meta.writtenAt as any)
    if (isNaN(writtenAt.getTime())) {
      throw new ParseError('Invalid writtenAt')
    }

    return { expiresAt, writtenAt }
  }

  private getCookieRecord(key: string, metaRecordKey: string): CacheRecord | null {
    const metaRecord = this.handler.getCookie(metaRecordKey)

    if (!metaRecord || metaRecord.length === 0) {
      return null
    }

    let _meta
    try {
      _meta = this.parseMetaRecord(metaRecord)
    } catch (e) {
      this.eventBus.emitErrorWithMessage('Cache', 'Failed reading meta from cookies', e)
      // delete this so we don't keep trying to read it
      this.deleteCookie(key)
      this.deleteCookie(metaRecordKey)
      return null
    }
    const meta = _meta!

    const expiresAt = meta.expiresAt
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      // expired. No need to clean up as the browser will do it for us
      return null
    }

    const data = this.handler.getCookie(key)
    if (!data) {
      return null
    }
    return { data, meta }
  }

  private getLSRecord(key: string, metaRecordKey: string): CacheRecord | null {
    const metaRecord = this.handler.getDataFromLocalStorage(metaRecordKey)

    if (!metaRecord || metaRecord.length === 0) {
      return null
    }

    let _meta
    try {
      _meta = this.parseMetaRecord(metaRecord)
    } catch (e) {
      this.eventBus.emitErrorWithMessage('Cache', 'Failed reading meta from ls', e)
      this.handler.removeDataFromLocalStorage(key)
      this.handler.removeDataFromLocalStorage(metaRecordKey)
      return null
    }
    const meta = _meta!

    const expiresAt = meta.expiresAt
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      // expired.
      this.handler.removeDataFromLocalStorage(key)
      this.handler.removeDataFromLocalStorage(metaRecordKey)
      return null
    }

    const data = this.handler.getDataFromLocalStorage(key)
    if (!data) {
      return null
    }

    return { data, meta }
  }

  get(key: string): CacheRecord | null {
    const metaRecordKey = metaKey(key)
    const cookieRecord = this.getCookieRecord(key, metaRecordKey)
    const lsRecord = this.getLSRecord(key, metaRecordKey)

    if (cookieRecord && lsRecord) {
      // comparing dates with getTime() because Date objects are not equal
      if (cookieRecord.meta.writtenAt.getTime() === lsRecord.meta.writtenAt.getTime()) {
        return cookieRecord
      } else if (cookieRecord.meta.writtenAt > lsRecord.meta.writtenAt) {
        // cookie record is newer. Update ls record
        this.handler.setDataInLocalStorage(key, cookieRecord.data)
        this.handler.setDataInLocalStorage(metaRecordKey, JSON.stringify(cookieRecord.meta))
        return cookieRecord
      } else {
        // ls record is newer. Update cookie record
        this.handler.setCookie(key, lsRecord.data)
        this.handler.setCookie(metaRecordKey, JSON.stringify(lsRecord.meta))
        return lsRecord
      }
    } else if (cookieRecord) {
      // only cookie record exists. Write to ls
      this.handler.setDataInLocalStorage(key, cookieRecord.data)
      this.handler.setDataInLocalStorage(metaRecordKey, JSON.stringify(cookieRecord.meta))
      return cookieRecord
    } else if (lsRecord) {
      // only ls record exists. Write to cookie
      this.handler.setCookie(key, lsRecord.data)
      this.handler.setCookie(metaRecordKey, JSON.stringify(lsRecord.meta))
      return lsRecord
    } else {
      return null
    }
  }

  set(key: string, value: string, expires?: Date): void {
    if (!expires && this.defaultExpirationHours) {
      expires = expiresInHours(this.defaultExpirationHours)
    }

    const metaRecordKey = metaKey(key)
    const metaRecord = JSON.stringify({ writtenAt: new Date(), expiresAt: expires })

    // set in ls
    this.handler.setDataInLocalStorage(key, value)
    this.handler.setDataInLocalStorage(metaRecordKey, metaRecord)

    // set in cookie
    this.handler.setCookie(key, value, expires, 'Lax', this.domain)
    this.handler.setCookie(metaRecordKey, metaRecord, expires, 'Lax', this.domain)
  }
}

export const NoOpCache: DurableCache = {
  get: () => null,
  set: () => undefined
}

function metaKey(baseKey: string): string {
  return `${baseKey}_meta`
}
