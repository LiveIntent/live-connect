import { StorageStrategies, StorageStrategy } from '../model/storage-strategy'
import { EventBus, ReadOnlyStorageHandler, StorageHandler, strEqualsIgnoreCase } from 'live-connect-common'
import { WrappingContext } from '../utils/wrapping'

type StorageRecord = {
  data: string
  expiresAt?: Date
}

const noop = () => undefined

function wrapRead<T extends object, K extends keyof T & string>(wrapper: WrappingContext<T>, storageStrategy: StorageStrategy, functionName: K) {
  return strEqualsIgnoreCase(storageStrategy, StorageStrategies.disabled) ? noop : wrapper.wrap(functionName)
}

function wrapWrite<T extends object, K extends keyof T & string>(wrapper: WrappingContext<T>, storageStrategy: StorageStrategy, functionName: K) {
  return strEqualsIgnoreCase(storageStrategy, StorageStrategies.none) ? noop : wrapRead(wrapper, storageStrategy, functionName)
}

export class WrappedReadOnlyStorageHandler implements ReadOnlyStorageHandler {
  private minimalFunctions

  protected constructor (storageStrategy: StorageStrategy, wrapper: WrappingContext<ReadOnlyStorageHandler>) {
    this.minimalFunctions = {
      getCookie: wrapRead(wrapper, storageStrategy, 'getCookie'),
      getDataFromLocalStorage: wrapRead(wrapper, storageStrategy, 'getDataFromLocalStorage'),
      localStorageIsEnabled: wrapWrite(wrapper, storageStrategy, 'localStorageIsEnabled')
    }
  }

  static make(storageStrategy: StorageStrategy, externalStorageHandler: ReadOnlyStorageHandler, eventBus: EventBus): WrappedReadOnlyStorageHandler {
    const wrapper = new WrappingContext(externalStorageHandler, 'ReadOnlyStorageHandler', eventBus)
    const handler = new WrappedReadOnlyStorageHandler(storageStrategy, wrapper)
    wrapper.reportErrors()
    return handler
  }

  localStorageIsEnabled(): boolean {
    return !!this.minimalFunctions.localStorageIsEnabled()
  }

  getCookie(key: string): string | null {
    return this.minimalFunctions.getCookie(key) || null
  }

  getDataFromLocalStorage(key: string): string | null {
    return this.minimalFunctions.getDataFromLocalStorage(key) || null
  }
}

export class WrappedStorageHandler extends WrappedReadOnlyStorageHandler implements StorageHandler {
  storageStrategy: StorageStrategy
  private functions

  protected constructor (storageStrategy: StorageStrategy, wrapper: WrappingContext<StorageHandler>) {
    super(storageStrategy, wrapper)

    this.storageStrategy = storageStrategy

    this.functions = {
      setCookie: wrapWrite(wrapper, storageStrategy, 'setCookie'),
      removeDataFromLocalStorage: wrapWrite(wrapper, storageStrategy, 'removeDataFromLocalStorage'),
      setDataInLocalStorage: wrapWrite(wrapper, storageStrategy, 'setDataInLocalStorage'),
      findSimilarCookies: wrapRead(wrapper, storageStrategy, 'findSimilarCookies')
    }
  }

  static make(storageStrategy: StorageStrategy, externalStorageHandler: StorageHandler, eventBus: EventBus): WrappedStorageHandler {
    const wrapper = new WrappingContext(externalStorageHandler, 'StorageHandler', eventBus)
    const handler = new WrappedStorageHandler(storageStrategy, wrapper)
    wrapper.reportErrors()
    return handler
  }

  private getCookieRecord(key: string): StorageRecord | null {
    let expiresAt: Date | undefined

    const cookieExpirationEntry = this.getCookie(expirationKey(key))
    if (cookieExpirationEntry && cookieExpirationEntry.length > 0) {
      expiresAt = new Date(cookieExpirationEntry)
      if (expiresAt <= new Date()) {
        return null
      }
    }

    const data = this.getCookie(key)
    if (data) {
      return { data, expiresAt }
    } else {
      return null
    }
  }

  private getLSRecord(key: string): StorageRecord | null {
    if (this.localStorageIsEnabled()) {
      let expiresAt: Date | undefined
      const oldLsExpirationEntry = this.getDataFromLocalStorage(expirationKey(key))

      if (oldLsExpirationEntry) {
        expiresAt = new Date(oldLsExpirationEntry)
        if (expiresAt <= new Date()) {
          this.removeDataFromLocalStorage(key)
          this.removeDataFromLocalStorage(expirationKey(key))
          return null
        }
      }

      const data = this.getDataFromLocalStorage(key)
      if (data) {
        return { data, expiresAt }
      } else {
        return null
      }
    } else {
      return null
    }
  }

  get(key: string): StorageRecord | null {
    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.none) || strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.disabled)) {
      return null
    } else if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.localStorage)) {
      return this.getLSRecord(key)
    } else {
      return this.getCookieRecord(key)
    }
  }

  set(key: string, value: string, expires?: Date, domain?: string): void {
    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.none) || strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.disabled)) {
      // pass
    } else if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategies.localStorage) && this.localStorageIsEnabled()) {
      this.setDataInLocalStorage(key, value)
      if (expires) {
        this.setDataInLocalStorage(expirationKey(key), `${expires}`)
      } else {
        this.removeDataFromLocalStorage(expirationKey(key))
      }
    } else {
      this.setCookie(key, value, expires, 'Lax', domain)
      if (expires) {
        this.setCookie(expirationKey(key), `${expires}`, expires, 'Lax', domain)
      } else {
        // sentinel value to indicate no expiration
        this.setCookie(expirationKey(key), '', undefined, 'Lax', domain)
      }
    }
  }

  setCookie(key: string, value: string, expires?: Date, sameSite?: string, domain?: string): void {
    this.functions.setCookie(key, value, expires, sameSite, domain)
  }

  setDataInLocalStorage(key: string, value: string): void {
    this.functions.setDataInLocalStorage(key, value)
  }

  removeDataFromLocalStorage(key: string): void {
    this.functions.removeDataFromLocalStorage(key)
  }

  findSimilarCookies(substring: string): string[] {
    return this.functions.findSimilarCookies(substring) || []
  }
}

function expirationKey(baseKey: string): string {
  return `${baseKey}_exp`
}
