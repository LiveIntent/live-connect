import { expect, use } from 'chai'
import * as identifiers from '../../../src/manager/identifiers'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon from 'sinon'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { LocalEventBus } from '../../../src/events/event-bus'

use(dirtyChai)

const eventBus = LocalEventBus()
const storage = new DefaultStorageHandler(eventBus)
const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)

describe('IdentifiersManager', () => {
  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.example.com'
    })
  })

  it('should create a first party cookie if it doesn\'t exist', () => {
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({}, storageHandler, eventBus)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party cookie if it doesn\'t exist, and storage strategy is cookie', () => {
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({}, storageHandler, eventBus)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party identifier in local storage if it doesn\'t exist, and storage strategy is ls', () => {
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(null)
    const localStorage = WrappedStorageHandler.make('ls', storage, eventBus)
    const resolutionResult = identifiers.resolve({}, localStorage, eventBus)
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi_exp')).to.be.not.null()
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should not create or return a first party identifier if the StorageStrategy is set to "none"', () => {
    const storageNone = WrappedStorageHandler.make('none', storage, eventBus)
    const resolutionResult = identifiers.resolve({}, storageNone, eventBus)
    expect(resolutionResult).to.include({ domain: '.www.example.com' })
  })

  it('should return the domain', () => {
    const resolutionResult = identifiers.resolve({}, storageHandler, eventBus)
    expect(resolutionResult.domain).to.eql('.example.com')
  })

  it('should re-use a first party cookie if it exist', () => {
    const id = 'xxxxx'
    // @ts-expect-error
    storageHandler.setCookie('_lc2_fpi', id, 400, undefined, '.example.com')
    const resolutionResult = identifiers.resolve({}, storageHandler, eventBus)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(id)
    expect(resolutionResult.liveConnectId).to.eql(id)
  })

  it('should emit an error if identifiers.resolve fails for some reason, return an empty object', () => {
    const stub = sandbox.stub(storage, 'getCookie').throws()
    const failedStorage = WrappedStorageHandler.make('cookie', storage, eventBus)
    const resolutionResult = identifiers.resolve({}, failedStorage, eventBus)
    expect(resolutionResult).to.eql({})
    stub.restore()
  })

  it('should create a first party cookie that starts with apex domain hash', () => {
    identifiers.resolve({}, storageHandler, eventBus)
    // apexOfExampleCom = '0caaf24ab1a0'
    expect(storageHandler.getCookie('_lc2_fpi')).to.match(/0caaf24ab1a0--.*/)
  })

  it('should create a first party cookie that is lowercased', () => {
    identifiers.resolve({}, storageHandler, eventBus)
    // @ts-expect-error
    expect(storageHandler.getCookie('_lc2_fpi')).to.satisfy(cookie => cookie === cookie.toLowerCase())
  })
})

describe('TLD checker', () => {
  beforeEach(() => jsdom('', {
    url: 'http://subdomain.tests.example.com'
  }))

  it('should determine correct tld', () => {
    const resolved = identifiers.resolve({}, storageHandler, eventBus)
    expect(resolved.domain).to.eq('.example.com')
  })

  it('should reuse the cached correct tld', () => {
    storageHandler.setCookie('_li_dcdm_c', '.example.com')
    const resolved = identifiers.resolve({}, storageHandler, eventBus)
    expect(resolved.domain).to.eq('.example.com')
  })
})

describe('TLD on sub-domain', () => {
  beforeEach(() => jsdom('', {
    url: 'http://example.co.uk'
  }))

  it('should use the full domain', () => {
    const resolved = identifiers.resolve({}, storageHandler, eventBus)
    expect(resolved.domain).to.eq('.example.co.uk')
  })
})
