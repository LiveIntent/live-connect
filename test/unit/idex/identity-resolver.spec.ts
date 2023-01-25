import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver } from '../../../src/idex/identity-resolver'
import { TestStorageHandler } from '../../shared/utils/storage'
import { TestCallHandler } from '../../shared/utils/calls'
import { LocalEventBus } from '../../../src/events/event-bus'
import dirtyChai from 'dirty-chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'

use(dirtyChai)

describe('IdentityResolver', () => {
  let requestToComplete = null
  const eventBus = LocalEventBus()
  const calls = TestCallHandler
  let errors = []
  let callCount = 0
  const storage = new TestStorageHandler(eventBus)
  const storageHandler = new StorageHandler('cookie', storage, eventBus)
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    eventBus.on('li_errors', (error) => { errors.push(error) })
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
    const identityResolver = IdentityResolver({}, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      expect(storageHandler.getCookie('__li_idex_cache')).to.be.eq(JSON.stringify(response))
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should invoke callback on success, if storing the result in a cookie fails', function () {
    const setCookieStub = sinon.createSandbox().stub(storage, 'setCookie').throws()
    const failedStorage = StorageHandler('cookie', storage, eventBus)
    const identityResolver = IdentityResolver({}, failedStorage, calls, eventBus)
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
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
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
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params with an array that should be serialized as repeated query', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&qf=0.1&resolve=age&resolve=gender')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { qf: '0.1', resolve: ['age', 'gender'] })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach publisher id', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/123?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the did', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver({ distributorId: 'did-01er' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?did=did-01er')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', function (done) {
    const identityResolver = IdentityResolver({ peopleVerifiedId: null }, storageHandler, calls, eventBus)
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
    }, storageHandler, calls, eventBus)
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
    }, storageHandler, calls, eventBus)
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
    }, storageHandler, calls, eventBus)
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
    const identityResolver = IdentityResolver({}, storageHandler, calls, eventBus)
    const errorCallback = (error) => {
      expect(error.message).to.be.eq('Incorrect status received : 500')
      done()
    }
    identityResolver.resolve(() => undefined, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should return different responses for different additional params', function () {
    const responseMd5 = { id: 123 }
    const responseSha1 = { id: 125 }

    const identityResolver = IdentityResolver({}, storageHandler, calls, eventBus)
    let jsonResponse = null
    const successCallback = (responseAsJson) => {
      jsonResponse = responseAsJson
    }
    identityResolver.resolve(successCallback, () => undefined, { type: 'md5' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(responseMd5))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?type=md5')
    expect(jsonResponse).to.be.eql(responseMd5)

    identityResolver.resolve(successCallback, () => undefined, { type: 'sha1' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(responseSha1))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?type=sha1')
    expect(jsonResponse).to.be.eql(responseSha1)

    jsonResponse = null
    identityResolver.resolve(successCallback, () => undefined, { type: 'sha1' })
    expect(jsonResponse).to.be.eql(responseSha1)

    jsonResponse = null
    identityResolver.resolve(successCallback, () => undefined, { type: 'md5' })
    expect(jsonResponse).to.be.eql(responseMd5)

    expect(callCount).to.be.eql(2)
  })

  it('should allow resolving custom attributes', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver(
      {
        identityResolutionConfig: {
          requestedAttributes: ['uid2', 'md5']
        }
      },
      storageHandler,
      calls,
      eventBus
    )
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?resolve=uid2&resolve=md5')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not resolve uid2 when privacy mode is enabled', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver(
      {
        identityResolutionConfig: {
          requestedAttributes: ['uid2', 'md5']
        },
        privacyMode: true
      },
      storageHandler,
      calls,
      eventBus
    )
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?n3pc=1&resolve=md5')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should prefer expires header from the server', function (done) {
    const response = { id: 112233 }
    let recordedExpiresAt

    const customStorage = StorageHandler('cookie', storage, eventBus)
    customStorage.set = (key, value, expiresAt, sameSite, domain) => {
      recordedExpiresAt = expiresAt
      storageHandler.set(key, value, expiresAt, sameSite, domain)
    }

    const identityResolver = IdentityResolver({}, customStorage, calls, eventBus)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    function epochSeconds (date) {
      Math.floor(date.getTime() / 1000)
    }

    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)

      expect(storageHandler.getCookie('__li_idex_cache')).to.be.eq(JSON.stringify(response))
      expect(epochSeconds(recordedExpiresAt)).to.be.eq(epochSeconds(expiresAt))

      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(
      200,
      { 'Content-Type': 'application/json', Expires: expiresAt.toUTCString() },
      JSON.stringify(response)
    )
  })
})
