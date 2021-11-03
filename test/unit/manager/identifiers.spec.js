import { expect, use } from 'chai'
import * as identifiers from '../../../src/manager/identifiers'
import * as externalStorage from '../../shared/utils/storage'
import sinon from 'sinon'
import jsdom from 'mocha-jsdom'
import dirtyChai from 'dirty-chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'

use(dirtyChai)

const storage = StorageHandler('cookie', externalStorage)

describe('IdentifiersManager', () => {
  const sandbox = sinon.createSandbox()

  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  it('should create a first party cookie if it doesn\'t exist', function () {
    expect(storage.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storage.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party cookie if it doesn\'t exist, and storage strategy is cookie', function () {
    expect(storage.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storage.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party identifier in local storage if it doesn\'t exist, and storage strategy is ls', function () {
    expect(storage.getDataFromLocalStorage('_lc2_fpi')).to.eql(null)
    const localStorage = StorageHandler('ls', externalStorage)
    const resolutionResult = identifiers.resolve({}, localStorage)
    expect(storage.getDataFromLocalStorage('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storage.getDataFromLocalStorage('_lc2_fpi_exp')).to.be.not.null()
    expect(storage.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should not create or return a first party identifier if the StorageStrategy is set to "none"', function () {
    const storageNone = StorageHandler('none', externalStorage)
    const resolutionResult = identifiers.resolve({}, storageNone)
    expect(resolutionResult).to.include({ domain: '.www.example.com', liveConnectId: null })
  })

  it('should return the domain', function () {
    const resolutionResult = identifiers.resolve({}, storage)
    expect(resolutionResult.domain).to.eql('.example.com')
  })

  it('should re-use a first party cookie if it exist', function () {
    const id = 'xxxxx'
    storage.setCookie('_lc2_fpi', id, 400, undefined, '.example.com')
    const resolutionResult = identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(id)
    expect(resolutionResult.liveConnectId).to.eql(id)
  })

  it('should emit an error if identifiers.resolve fails for some reason, return an empty object', function () {
    const stub = sandbox.stub(externalStorage, 'getCookie').throws()
    const failedStorage = StorageHandler('cookie', externalStorage)
    const resolutionResult = identifiers.resolve({}, failedStorage)
    expect(resolutionResult).to.eql({})
    stub.restore()
  })

  it('should create a first party cookie that starts with apex domain hash', function () {
    identifiers.resolve({}, storage)
    // apexOfExampleCom = '0caaf24ab1a0'
    expect(storage.getCookie('_lc2_fpi')).to.match(/0caaf24ab1a0--.*/)
  })

  it('should create a first party cookie that is lowercased', function () {
    identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.satisfy(cookie => cookie === cookie.toLowerCase())
  })
})

describe('TLD checker', () => {
  jsdom({
    url: 'http://subdomain.tests.example.com'
  })

  it('should determine correct tld', function () {
    const resolved = identifiers.resolve({}, storage)
    expect(resolved.domain).to.eq('.example.com')
  })

  it('should reuse the cached correct tld', function () {
    storage.setCookie('_li_dcdm_c', '.example.com')
    const resolved = identifiers.resolve({}, storage)
    expect(resolved.domain).to.eq('.example.com')
  })
})

describe('TLD on sub-domain', () => {
  jsdom({
    url: 'http://example.co.uk'
  })

  it('should use the full domain', function () {
    const resolved = identifiers.resolve({}, storage)
    expect(resolved.domain).to.eq('.example.co.uk')
  })
})
