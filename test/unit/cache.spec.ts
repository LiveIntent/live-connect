import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import { WrappedStorageHandler } from '../../src/handlers/storage-handler'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon, { SinonStub } from 'sinon'
import { EventBus, expiresInDays } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../src/events/event-bus'
import { StorageHandlerBackedCache } from '../../src/cache'
import { StorageStrategy } from '../../src/model/storage-strategy'

use(dirtyChai)

type RecordedError = {
  name: string
  message: string
  exception?: unknown
}

describe('StorageHandler', () => {
  let errors: RecordedError[] = []
  let eventBusStub: SinonStub<[string, string, unknown?], EventBus>
  const eventBus = LocalEventBus()
  const storage = new DefaultStorageHandler(eventBus)

  const sandbox = sinon.createSandbox()
  beforeEach(() => {
    errors = []
    jsdom('', {
      url: 'http://www.something.example.com'
    })

    eventBusStub = sandbox.stub(eventBus, 'emitErrorWithMessage').callsFake((name, message, e) => {
      errors.push({
        name,
        message,
        exception: e
      })
      return eventBus
    })
  })

  afterEach(() => {
    eventBusStub.restore()
  })

  it('should use local storage', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'ls',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(cache.get('key')?.data).to.be.eq('value')
    expect(storageHandler.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(cache.get('unknownKey')).to.be.null()
  })

  it('should use cookies', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(cache.get('key')?.data).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(cache.get('unknownKey')).to.be.null()
  })

  it('should use cookies when the strategy is not defined', () => {
    const storageHandler = WrappedStorageHandler.make(null as unknown as StorageStrategy, storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: null as unknown as 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(cache.get('key')?.data).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(cache.get('unknownKey')).to.be.null()
  })

  it('should return nothing when the underlying handler\'s strategy is none', () => {
    const storageHandler = WrappedStorageHandler.make('none', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(cache.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
    expect(errors.length).to.be.eq(0)
  })

  it('should return nothing when the underlying handler\'s the strategy is disabled', () => {
    const storageHandler = WrappedStorageHandler.make('disabled', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key_any', 'value_any', expiresInDays(1))
    storageHandler.setDataInLocalStorage('key_ls', 'value_any')
    storageHandler.setCookie('key_cookie', 'value_cookie', expiresInDays(1), 'Lax', 'example.com')

    storageHandler.removeDataFromLocalStorage('key_ls')

    expect(cache.get('key_any')).to.be.null()
    expect(storageHandler.getDataFromLocalStorage('key_ls')).to.be.null()
    expect(storageHandler.getCookie('key_cookie')).to.be.null()

    expect(storageHandler.findSimilarCookies('key_cookie')).to.be.empty()
    expect(storageHandler.localStorageIsEnabled()).to.be.false()
    expect(errors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is ls and the time is in the past', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'ls',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(-1))
    expect(cache.get('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
  })

  it('should return nothing when the strategy is cookie and the time is in the past', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(-1))
    expect(cache.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })

  it('should update expiration when overwriting localstorage with expiration with one without', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'ls',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(5))
    cache.set('key', 'value', undefined)

    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.expiresAt).to.be.undefined()
  })

  it('should update expiration when overwriting a cookie with expiration with one without', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(5))
    cache.set('key', 'value', undefined)

    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.expiresAt).to.be.undefined()
  })
})
