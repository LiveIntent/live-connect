import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import { EventBus, ExternalMinimalStorageHandler, ExternalStorageHandler, StorageStrategyMode } from '../types'
import { WrappingContext } from '../utils/wrapping'

interface WrappedExternalMinimalStorageHandler {
  getCookie: (key: string) => string | null | undefined,
  getDataFromLocalStorage: (key: string) => string | null | undefined,
  localStorageIsEnabled: () => boolean | undefined,
}

interface WrappedExternalStorageHandler {
  setCookie: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
  setDataInLocalStorage: (key: string, value: string) => void,
  removeDataFromLocalStorage: (key: string) => void,
  findSimilarCookies: (substring: string) => string[] | undefined
}

const noop = () => undefined

function wrapRead<T extends object, K extends keyof T & string>(wrapper: WrappingContext<T>, storageStrategy: StorageStrategyMode, functionName: K) {
  return strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled) ? noop : wrapper.wrap(functionName)
}

function wrapWrite<T extends object, K extends keyof T & string>(wrapper: WrappingContext<T>, storageStrategy: StorageStrategyMode, functionName: K) {
  return strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? noop : wrapper.wrap(functionName)
}

export class MinimalStorageHandler {
  private minimalFunctions: WrappedExternalMinimalStorageHandler

  constructor (storageStrategy: StorageStrategyMode, externalStorageHandler: ExternalMinimalStorageHandler, eventBus?: EventBus) {
    const wrapper = new WrappingContext(externalStorageHandler, 'ReadStorageHandler', eventBus)

    this.minimalFunctions = {
      getCookie: wrapRead(wrapper, storageStrategy, 'getCookie'),
      getDataFromLocalStorage: wrapRead(wrapper, storageStrategy, 'getDataFromLocalStorage'),
      localStorageIsEnabled: wrapRead(wrapper, storageStrategy, 'localStorageIsEnabled')
    }

    wrapper.reportErrors()
  }

  localStorageIsEnabled (): boolean {
    return !!this.minimalFunctions['localStorageIsEnabled']()
  }

  getCookie (key: string): string | null {
    return this.minimalFunctions['getCookie'](key) || null
  }

  getDataFromLocalStorage (key: string): string | null {
    return this.minimalFunctions['getDataFromLocalStorage'](key) || null
  }

}

export class StorageHandler extends MinimalStorageHandler {
  private functions: WrappedExternalStorageHandler
  storageStrategy: StorageStrategyMode

  constructor (storageStrategy: StorageStrategyMode, externalStorageHandler: ExternalStorageHandler, eventBus?: EventBus) {
    super(storageStrategy, externalStorageHandler, eventBus)

    const wrapper = new WrappingContext(externalStorageHandler, 'StorageHandler', eventBus)
    this.storageStrategy = storageStrategy

    this.functions = {
      setCookie: wrapWrite(wrapper, storageStrategy, 'setCookie'),
      removeDataFromLocalStorage: wrapWrite(wrapper, storageStrategy, 'removeDataFromLocalStorage'),
      setDataInLocalStorage: wrapWrite(wrapper, storageStrategy, 'setDataInLocalStorage'),
      findSimilarCookies: wrapRead(wrapper, storageStrategy, 'findSimilarCookies')
    }

    wrapper.reportErrors()
  }

  get (key: string): string | null {
    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.none) || strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.disabled)) {
      return null
    } else if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.localStorage)) {
      if (this.localStorageIsEnabled()) {
        const expirationKey = `${key}_exp`
        const oldLsExpirationEntry = this.getDataFromLocalStorage(expirationKey)
        if (oldLsExpirationEntry && Date.parse(oldLsExpirationEntry) <= new Date().getTime()) {
          this.functions.removeDataFromLocalStorage(key)
        }
        return this.getDataFromLocalStorage(key)
      } else {
        return null
      }
    } else {
      return this.getCookie(key)
    }
  }

  set (key: string, value: string, expires: Date, domain?: string): void {
    if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.none) || strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.disabled)) {
      // pass
    } else if (strEqualsIgnoreCase(this.storageStrategy, StorageStrategy.localStorage)) {
      if (this.localStorageIsEnabled()) {
        const expirationKey = `${key}_exp`
        this.setDataInLocalStorage(key, value)
        this.setDataInLocalStorage(expirationKey, `${expires}`)
      }
    } else {
      this.setCookie(key, value, expires, 'Lax', domain)
    }
  }

  setCookie (key: string, value: string, expires?: Date, sameSite?: string, domain?: string): void {
    this.functions['setCookie'](key, value, expires, sameSite, domain)
  }

  setDataInLocalStorage (key: string, value: string): void {
    this.functions['setDataInLocalStorage'](key, value)
  }

  removeDataFromLocalStorage (key: string): void {
    this.functions['removeDataFromLocalStorage'](key)
  }

  findSimilarCookies (substring: string): string[] {
    return this.functions['findSimilarCookies'](substring) || []
  }
}
