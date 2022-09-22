import jsdom from 'mocha-jsdom'
import { expect, use } from 'chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'
import * as storage from '../../shared/utils/storage'
import sinon from 'sinon'
import * as emitter from '../../../src/utils/emitter'
import { expiresInDays } from '../../../src/utils/types'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('StorageHandler', () => {
  let emitterErrors = []
  let emitterStub
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    emitterErrors = []
    emitterStub = sandbox.stub(emitter, 'error').callsFake((name, message, e) => {
      emitterErrors.push({
        name: name,
        message: message,
        exception: e
      })
    })
  })

  afterEach(() => {
    emitterStub.restore()
  })

  it('should send an error if an external handler is not provided', function () {
    StorageHandler('cookie')
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('StorageHandler')
    expect(emitterErrors[0].message).to.be.eq('The storage functions \'["localStorageIsEnabled","getCookie","setCookie","getDataFromLocalStorage","removeDataFromLocalStorage","setDataInLocalStorage","findSimilarCookies"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler is not provided and the storage strategy is none', function () {
    StorageHandler('none')
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('StorageHandler')
    expect(emitterErrors[0].message).to.be.eq('The storage functions \'["getCookie","getDataFromLocalStorage","findSimilarCookies"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should not send an error if an external handler is not provided and the storage strategy is disabled', function () {
    StorageHandler('disabled')
    expect(emitterErrors.length).to.be.eq(0)
  })

  it('should use local storage', function () {
    const storageHandler = StorageHandler('ls', storage)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getDataFromLocalStorage('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies', function () {
    const storageHandler = StorageHandler('cookie', storage)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should use cookies when the strategy is not defined', function () {
    const storageHandler = StorageHandler(null, storage)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.eq('value')
    expect(storage.getCookie('key')).to.be.eq('value')
    expect(storageHandler.get('unknownKey')).to.be.null()
  })

  it('should return nothing when the strategy is none', function () {
    const storageHandler = StorageHandler('none', storage)
    storageHandler.set('key', 'value', expiresInDays(1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
    expect(emitterErrors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is disabled', function () {
    const storageHandler = StorageHandler('disabled', storage)

    storageHandler.set('key_any', 'value_any', expiresInDays(1), 'example.com')
    storageHandler.setDataInLocalStorage('key_ls', 'value_any')
    storageHandler.setCookie(('key_cookie', 'value_cookie', expiresInDays(1), 'Lax', 'example.com'))

    expect(storageHandler.get('key_any')).to.be.null()
    expect(storageHandler.getDataFromLocalStorage('key_ls')).to.be.undefined()
    expect(storageHandler.getCookie('key_cookie')).to.be.undefined()

    expect(storageHandler.removeDataFromLocalStorage('key_ls')).to.be.undefined()
    expect(storageHandler.findSimilarCookies('key_cookie')).to.be.undefined()
    expect(storageHandler.localStorageIsEnabled()).to.be.undefined()
    expect(emitterErrors.length).to.be.eq(0)
  })

  it('should return nothing when the strategy is ls and the time is in the past', function () {
    const storageHandler = StorageHandler('ls', storage)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getDataFromLocalStorage('key')).to.be.null()
  })

  it('should return nothing when the strategy is cookie and the time is in the past', function () {
    const storageHandler = StorageHandler('cookie', storage)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })

  it('should return nothing when the strategy is undefined and the time is in the past', function () {
    const storageHandler = StorageHandler(null, storage)
    storageHandler.set('key', 'value', expiresInDays(-1), 'example.com')
    expect(storageHandler.get('key')).to.be.null()
    expect(storage.getCookie('key')).to.be.null()
  })
})
