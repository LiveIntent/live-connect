import { StorageStrategies, StorageStrategy } from '../model/storage-strategy'
import { EventBus, ReadOnlyStorageHandler, StorageHandler, strEqualsIgnoreCase } from 'live-connect-common'
import { WrappingContext } from '../utils/wrapping'

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
