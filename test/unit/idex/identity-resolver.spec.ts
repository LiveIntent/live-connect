// @ts-nocheck

import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver } from '../../../src/idex'
import { DefaultStorageHandler, DefaultCallHandler } from 'live-connect-handlers'
import { LocalEventBus } from '../../../src/events/event-bus'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { WrappedCallHandler } from '../../../src/handlers/call-handler'

use(dirtyChai)

describe('IdentityResolver', () => {
  let requestToComplete = null
  const eventBus = LocalEventBus()
  const calls = new WrappedCallHandler(new DefaultCallHandler(), eventBus)
  const storage = new DefaultStorageHandler(eventBus)
  let errors = []
  let callCount = 0
  const storageHandler = WrappedStorageHandler.make('cookie', new DefaultStorageHandler(eventBus), eventBus)

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.something.example.com'
    })

    eventBus.on('li_errors', error => errors.push(error))
    global.XDomainRequest = null
    global.XMLHttpRequest = sinon.createSandbox().useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = request => {
      requestToComplete = request
      callCount += 1
    }
    callCount = 0
    errors = []
  })

  it('should invoke callback on success, store the result in a cookie', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({}, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      expect(storageHandler.getCookie('__li_idex_cache_e30')).to.be.eq(JSON.stringify(response))
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should invoke callback on success, if storing the result in a cookie fails', () => {
    const setCookieStub = sinon.createSandbox().stub(storage, 'setCookie').throws()
    const failedStorage = WrappedStorageHandler.make('cookie', storage, eventBus)
    const identityResolver = IdentityResolver.make({}, failedStorage, calls, eventBus)
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

  it('should attach the duid', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params with an array that should be serialized as repeated query', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987&qf=0.1&resolve=age&resolve=gender')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { qf: '0.1', resolve: ['age', 'gender'] })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach publisher id', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/123?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the did', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ distributorId: 'did-01er' }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?did=did-01er')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', (done) => {
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: null }, storageHandler, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql({})
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({}))
  })

  it('should attach the duid & multiple retrieved identifiers', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({
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

  it('should attach the consent values when gpdr does not apply', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({
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

  it('should attach the consent and n3pc values when gpdr applies', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({
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

  it('should return the default empty response and emit error if response is 500', (done) => {
    const identityResolver = IdentityResolver.make({}, storageHandler, calls, eventBus)
    const errorCallback = (error) => {
      expect(error.message).to.match(/^Error during XHR call: 500/)
      done()
    }
    identityResolver.resolve(() => undefined, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should return different responses for different additional params', () => {
    const responseMd5 = { id: 123 }
    const responseSha1 = { id: 125 }

    const identityResolver = IdentityResolver.make({}, storageHandler, calls, eventBus)
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

  it('should allow resolving custom attributes', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make(
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

  it('should not resolve uid2 when privacy mode is enabled', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make(
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

  it('should prefer expires header from the server', (done) => {
    const response = { id: 112233 }
    let recordedExpiresAt: Date

    const customStorage = WrappedStorageHandler.make('cookie', storage, eventBus)
    customStorage.set = (key, value, expiresAt, sameSite, domain) => {
      recordedExpiresAt = expiresAt
      storageHandler.set(key, value, expiresAt, sameSite, domain)
    }

    const identityResolver = IdentityResolver.make({}, customStorage, calls, eventBus)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    function epochSeconds(date) {
      Math.floor(date.getTime() / 1000)
    }

    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)

      expect(storageHandler.getCookie('__li_idex_cache_e30')).to.be.eq(JSON.stringify(response))
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
