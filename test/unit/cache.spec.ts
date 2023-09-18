import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import { WrappedStorageHandler } from '../../src/handlers/storage-handler'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon, { SinonStub } from 'sinon'
import { EventBus, expiresInDays } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../src/events/event-bus'
import { StorageHandlerBackedCache } from '../../src/cache'

use(dirtyChai)

type RecordedError = {
  name: string
  message: string
  exception?: unknown
}

describe('Cache', () => {
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

  it('should use both cookie and local storage', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(cache.get('key')?.data).to.be.eq('value')

    expect(storageHandler.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')

    expect(cache.get('unknownKey')).to.be.null()
  })

  it('should use local storage entry and repair cookie if cookie is deleted', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(storageHandler.getCookie('key')).to.be.eq('value')
    storage.setCookie('key', '', new Date(0), 'Lax', 'example.com')

    expect(cache.get('key')?.data).to.be.eq('value')

    expect(storageHandler.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
  })

  it('should use cookie entry and repair ls if ls is deleted', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(1))
    expect(storageHandler.getDataFromLocalStorage('key')).to.be.eq('value')
    storage.removeDataFromLocalStorage('key')

    expect(cache.get('key')?.data).to.be.eq('value')
    expect(storageHandler.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
  })

  it('should write nothing when the underlying handler\'s strategy is none', () => {
    const storageHandler = WrappedStorageHandler.make('none', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
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
      storageHandler,
      eventBus,
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
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(-1))
    expect(cache.get('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
  })

  it('should return nothing when the strategy is cookie and the time is in the past', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(-1))
    expect(cache.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })

  it('should return expiration date', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    const expires = expiresInDays(5)

    cache.set('key', 'value', expires)
    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.meta.expiresAt!.getTime()).to.be.eq(expires.getTime())
  })

  it('should return written date', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    const now = new Date()

    cache.set('key', 'value', expiresInDays(5))
    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.meta.writtenAt.getTime()).to.be.greaterThanOrEqual(now.getTime())
  })

  it('should prefer the younger entry and fix the older entry if both exist', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(5))

    const metaRecord = storageHandler.getDataFromLocalStorage('key_meta')!
    const meta = JSON.parse(metaRecord)
    storage.setDataInLocalStorage('key', 'value1')
    storage.setDataInLocalStorage('key_meta', JSON.stringify({ ...meta, writtenAt: new Date(new Date(meta.writtenAt).getTime() - 1) }))

    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(storage.getDataFromLocalStorage('key')).to.be.eq('value')
  })

  it('should update expiration when overwriting localstorage with expiration with one without', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(5))
    cache.set('key', 'value', undefined)

    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.meta.expiresAt).to.be.undefined()
  })

  it('should update expiration when overwriting a cookie with expiration with one without', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      domain: 'example.com'
    })

    cache.set('key', 'value', expiresInDays(5))
    cache.set('key', 'value', undefined)

    const result = cache.get('key')

    expect(result?.data).to.be.eq('value')
    expect(result?.meta.expiresAt).to.be.undefined()
  })
})
