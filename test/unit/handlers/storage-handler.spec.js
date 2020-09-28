import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'
import * as storage from '../../shared/utils/storage'
import sinon from 'sinon'
import * as emitter from '../../../src/utils/emitter'

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

  it('should respect StorageStrategy == "none" for reads', function () {
    const storageHandler = StorageHandler('none')
    storageHandler.setCookie('x', 'value-of-x')
    storageHandler.setDataInLocalStorage('y', 'value-of-y')
    expect(storage.getCookie('x')).to.be.null
    expect(storage.getDataFromLocalStorage('y')).to.be.null
    expect(storage.findSimilarCookies('x')).to.be.eql([])
  })

  it('should send an error if an external handler is not provided', function () {
    StorageHandler('cookie')
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('StorageHandler')
    expect(emitterErrors[0].message).to.be.eq('The storage functions \'["localStorageIsEnabled","getCookie","setCookie","getDataFromLocalStorage","removeDataFromLocalStorage","setDataInLocalStorage","findSimilarCookies"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined
  })

  it('should send an error if an external handler is not provided and the storage strategy is none', function () {
    const storageHandler = StorageHandler('none')
    storageHandler.setCookie('x', 'value-of-x')
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('StorageHandler')
    expect(emitterErrors[0].message).to.be.eq('The storage functions \'["getCookie","getDataFromLocalStorage","findSimilarCookies"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined
  })

  it('should use the external storage handler if provided', function () {
    const calls = {}
    const extStorageHandler = {
      setCookie: function () {
        calls.setCookie = Array.from(arguments)
      }
    }
    const storageHandler = StorageHandler('cookie', extStorageHandler)
    storageHandler.setCookie('x', 'value-of-x')
    expect(calls.setCookie).to.be.eql(['x', 'value-of-x'])
    expect(storage.getCookie('x')).to.be.null
  })

  it('should use a partial storage handler', function () {
    const calls = {}
    const extStorageHandler = {
      setCookie: function () {
        calls.setCookie = Array.from(arguments)
      },
      setDataInLocalStorage: storage.setDataInLocalStorage
    }
    const storageHandler = StorageHandler('cookie', extStorageHandler)
    storageHandler.setDataInLocalStorage('x', 'value-of-x')
    expect(calls.setCookie).to.be.undefined
    expect(storage.getDataFromLocalStorage('x')).to.be.eq('value-of-x')
  })
})
