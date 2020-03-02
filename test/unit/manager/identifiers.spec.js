import { expect } from 'chai'
import * as identifiers from '../../../src/manager/identifiers'
import * as storage from '../../../src/utils/storage'
import sinon from 'sinon'
import jsdom from 'mocha-jsdom'
import { StorageStrategy } from '../../../src/model/storage-strategy'



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
  })

  it('should create a first party cookie if it doesn\'t exist, and storage strategy is cookie', function () {
    expect(storage.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({storageStrategy: 'cookie'}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party identifier in local storage if it doesn\'t exist, and storage strategy is ls', function () {
    expect(storage.getDataFromLocalStorage('_lc2_fpi')).to.eql(null)
    const resolutionResult = identifiers.resolve({storageStrategy: 'ls'}, storage)
    expect(storage.getDataFromLocalStorage('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storage.getDataFromLocalStorage('_lc2_fpi_exp')).to.be.not.null
  })

  it('should not create or return a first party identifier if the StorageStrategy is set to "none"', function () {
    const resolutionResult = identifiers.resolve({ storageStrategy: StorageStrategy.none }, storage)
    expect(resolutionResult).to.include({ domain: '.example.com', liveConnectId: null })
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

  it('should read the legacyId', function () {
    expect(storage.getCookie('_lc2_fpi')).to.eql(null)
    storage.setDataInLocalStorage('_litra_id.2a0b', 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0.1538047703.39.1573030646.1550763182.eaff6045-fa6f-4073-9397-598a9e64ca12')
    const resolutionResult = identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect({
      duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
      creationTs: '1538047703',
      sessionCount: '39',
      currVisitTs: '1573030646',
      lastSessionVisitTs: '1550763182',
      sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'

    }).to.eql(resolutionResult.legacyId)
  })

  it('should read provided first party identifier from a cookie first', function () {
    storage.setCookie('pfpcn', 'cookie-identifier')
    const resolutionResult = identifiers.resolve({ providedIdentifierName: 'pfpcn' }, storage)
    expect(resolutionResult.providedIdentifier).to.eql('cookie-identifier')
  })

  it('should read provided first party identifier from ls, if it cannot be found in a cookie', function () {
    storage.setDataInLocalStorage('pfpcn', 'ls-identifier')
    const resolutionResult = identifiers.resolve({ providedIdentifierName: 'pfpcn' }, storage)
    expect(resolutionResult.providedIdentifier).to.eql('ls-identifier')
  })

  it('should ignore a malformed legacy id', function () {
    expect(storage.getCookie('_lc2_fpi')).to.eql(null)
    storage.setDataInLocalStorage('_litra_id.2a0b', 'some-mumbo-jumbo')
    const resolutionResult = identifiers.resolve({}, storage)
    expect(storage.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(resolutionResult.legacyId).to.eql(undefined)
  })

  it('should emit an error if identifiers.resolve fails for some reason, return an empty object', function () {
    const stub = sandbox.stub(storage, 'getCookie').throws()
    const resolutionResult = identifiers.resolve({}, storage)
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
