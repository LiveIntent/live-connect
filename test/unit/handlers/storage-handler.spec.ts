import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon, { SinonStub } from 'sinon'
import { EventBus, expiresInDays } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'

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

  it('should send an error if an external handler is not provided', () => {
    WrappedStorageHandler.make('cookie', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","localStorageIsEnabled","setCookie","removeDataFromLocalStorage","setDataInLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler is not provided and the storage strategy is none', () => {
    WrappedStorageHandler.make('none', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should not send an error if an external handler is not provided and the storage strategy is disabled', () => {
    WrappedStorageHandler.make('disabled', {}, eventBus)
    expect(errors.length).to.be.eq(0)
  })

  it('should use local storage', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies when the strategy is not defined', () => {
    // @ts-expect-error
    const storageHandler = WrappedStorageHandler.make(null, storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should return nothing when the strategy is none', () => {
    const storageHandler = WrappedStorageHandler.make('none', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
    expect(errors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is disabled', () => {
    const storageHandler = WrappedStorageHandler.make('disabled', storage, eventBus)

    storageHandler.set('key_any', 'value_any', expiresInDays(1), 'example.com')
    storageHandler.setDataInLocalStorage('key_ls', 'value_any')
    storageHandler.setCookie('key_cookie', 'value_cookie', expiresInDays(1), 'Lax', 'example.com')

    storageHandler.removeDataFromLocalStorage('key_ls')

    expect(storageHandler.get('key_any')).to.be.null()
    expect(storageHandler.getDataFromLocalStorage('key_ls')).to.be.null()
    expect(storageHandler.getCookie('key_cookie')).to.be.null()

    expect(storageHandler.findSimilarCookies('key_cookie')).to.be.empty()
    expect(storageHandler.localStorageIsEnabled()).to.be.false()
    expect(errors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is ls and the time is in the past', () => {
    const storageHandler = WrappedStorageHandler.make('ls', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
  })

  it('should return nothing when the strategy is cookie and the time is in the past', () => {
    const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })

  it('should return nothing when the strategy is undefined and the time is in the past', () => {
    // @ts-expect-error
    const storageHandler = WrappedStorageHandler.make(null, storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })
})
