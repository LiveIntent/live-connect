import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver } from '../../../src/idex/identity-resolver'
import * as externalStorage from '../../shared/utils/storage'
import * as calls from '../../shared/utils/calls'
import { init } from '../../../src/events/bus'
import dirtyChai from 'dirty-chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'

use(dirtyChai)

describe('IdentityResolver', () => {
  let requestToComplete = null
  let errors = []
  let callCount = 0
  const storage = StorageHandler('cookie', externalStorage)
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    init()
    window.__li__evt_bus.on('li_errors', (error) => { errors.push(error) })
    global.XDomainRequest = null
    global.XMLHttpRequest = sinon.createSandbox().useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = function (request) {
      requestToComplete = request
      callCount += 1
    }
    callCount = 0
    errors = []
  })

  it('should invoke callback on success, store the result in a cookie', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({}, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      expect(storage.getCookie('__li_idex_cache')).to.be.eq(JSON.stringify(response))
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should invoke callback on success, if storing the result in a cookie fails', function () {
    const setCookieStub = sinon.createSandbox().stub(externalStorage, 'setCookie').throws()
    const failedStorage = StorageHandler('cookie', externalStorage)
    const identityResolver = IdentityResolver({}, failedStorage, calls)
    let jsonResponse = null
    const successCallback = (responseAsJson) => {
      jsonResponse = responseAsJson
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 321 }))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
    expect(jsonResponse).to.be.eql({ id: 321 })

    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 123 }))
    expect(jsonResponse).to.be.eql({ id: 123 })
    setCookieStub.restore()
    expect(errors).to.not.be.empty()
    expect(callCount).to.be.eql(2)
  })

  it('should attach the duid', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => {}, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params with an array that should be serialized as repeated query', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&qf=0.1&resolve=age&resolve=gender')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => {}, { qf: '0.1', resolve: ['age', 'gender'] })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach publisher id', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/123?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => {}, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', function (done) {
    const identityResolver = IdentityResolver({ peopleVerifiedId: null }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql({})
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({}))
  })

  it('should attach the duid & multiple retrieved identifiers', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({
      peopleVerifiedId: '987',
      retrievedIdentifiers: [
        {
          name: 'pubcid',
          value: 'exexex'
        },
        {
          name: 'some-id',
          value: 'AnotherId'
        }
      ]
    }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&pubcid=exexex&some-id=AnotherId')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the consent values when gpdr does not apply', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({
      gdprApplies: false,
      privacyMode: false,
      gdprConsent: 'gdprConsent',
      usPrivacyString: 'usPrivacyString'
    }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?us_privacy=usPrivacyString&gdpr=0&gdpr_consent=gdprConsent')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the consent and n3pc values when gpdr applies', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({
      gdprApplies: true,
      privacyMode: true,
      gdprConsent: 'gdprConsent',
      usPrivacyString: 'usPrivacyString'
    }, storage, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?us_privacy=usPrivacyString&gdpr=1&n3pc=1&gdpr_consent=gdprConsent')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should return the default empty response and emit error if response is 500', function (done) {
    const identityResolver = IdentityResolver({}, storage, calls)
    const errorCallback = (error) => {
      expect(error.message).to.be.eq('Incorrect status received : 500')
      done()
    }
    identityResolver.resolve(() => {}, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should return different responses for different additional params', function () {
    const responseMd5 = { id: 123 }
    const responseSha1 = { id: 125 }

    const identityResolver = IdentityResolver({}, storage, calls)
    let jsonResponse = null
    const successCallback = (responseAsJson) => {
      jsonResponse = responseAsJson
    }
    identityResolver.resolve(successCallback, () => {}, { type: 'md5' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(responseMd5))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?type=md5')
    expect(jsonResponse).to.be.eql(responseMd5)

    identityResolver.resolve(successCallback, () => {}, { type: 'sha1' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(responseSha1))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?type=sha1')
    expect(jsonResponse).to.be.eql(responseSha1)

    jsonResponse = null
    identityResolver.resolve(successCallback, () => {}, { type: 'sha1' })
    expect(jsonResponse).to.be.eql(responseSha1)

    jsonResponse = null
    identityResolver.resolve(successCallback, () => {}, { type: 'md5' })
    expect(jsonResponse).to.be.eql(responseMd5)

    expect(callCount).to.be.eql(2)
  })
})
