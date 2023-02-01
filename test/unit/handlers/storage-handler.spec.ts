import jsdom from 'mocha-jsdom'
import { expect, use } from 'chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'
import { TestStorageHandler } from '../../shared/utils/storage'
import sinon, { SinonStub } from 'sinon'
import { expiresInDays } from '../../../src/utils/types'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { EventBus } from '../../../src/types'

use(dirtyChai)

type RecordedError = {
  name: string;
  message: string;
  exception?: unknown;
}

describe('StorageHandler', () => {
  let errors: RecordedError[] = []
  let eventBusStub: SinonStub<[string, string, unknown?], EventBus>
  const eventBus = LocalEventBus()
  const storage = new TestStorageHandler(eventBus)
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    errors = []
    eventBusStub = sandbox.stub(eventBus, 'emitErrorWithMessage').callsFake((name, message, e) => {
      errors.push({
        name: name,
        message: message,
        exception: e
      })
      return eventBus
    })
  })

  afterEach(() => {
    eventBusStub.restore()
  })

  it('should send an error if an external handler is not provided', function () {
    StorageHandler.make('cookie', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","localStorageIsEnabled","setCookie","removeDataFromLocalStorage","setDataInLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler is not provided and the storage strategy is none', function () {
    StorageHandler.make('none', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should not send an error if an external handler is not provided and the storage strategy is disabled', function () {
    StorageHandler.make('disabled', {}, eventBus)
    expect(errors.length).to.be.eq(0)
  })

  it('should use local storage', function () {
    const storageHandler = StorageHandler.make('ls', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies', function () {
    const storageHandler = StorageHandler.make('cookie', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies when the strategy is not defined', function () {
    const storageHandler = StorageHandler.make(null, storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should return nothing when the strategy is none', function () {
    const storageHandler = StorageHandler.make('none', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
    expect(errors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is disabled', function () {
    const storageHandler = StorageHandler.make('disabled', storage, eventBus)

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

  it('should return nothing when the strategy is ls and the time is in the past', function () {
    const storageHandler = StorageHandler.make('ls', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
  })

  it('should return nothing when the strategy is cookie and the time is in the past', function () {
    const storageHandler = StorageHandler.make('cookie', storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })

  it('should return nothing when the strategy is undefined and the time is in the past', function () {
    const storageHandler = StorageHandler.make(null, storage, eventBus)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })
})
