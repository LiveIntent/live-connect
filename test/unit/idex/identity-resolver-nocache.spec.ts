import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver } from '../../../src/idex'
import { TestCallHandler } from '../../shared/utils/calls'
import { LocalEventBus } from '../../../src/events/event-bus'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('IdentityResolver without cache', () => {
  let requestToComplete = null
  const eventBus = LocalEventBus()
  const calls = TestCallHandler
  let errors = []
  let callCount = 0
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

  it('should invoke callback on success', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.makeNoCache({}, calls, eventBus)
    const successCallback = (responseAsJson) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the duid', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.makeNoCache({ peopleVerifiedId: '987' }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({ peopleVerifiedId: '987' }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({ peopleVerifiedId: '987' }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/123?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', function (done) {
    const identityResolver = IdentityResolver.makeNoCache({ peopleVerifiedId: null }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({
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
    }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({
      gdprApplies: false,
      privacyMode: false,
      gdprConsent: 'gdprConsent',
      usPrivacyString: 'usPrivacyString'
    }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?us_privacy=usPrivacyString&gdpr=0&gdpr_consent=gdprConsent')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the consent and nc values when gpdr applies', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.makeNoCache({
      gdprApplies: true,
      privacyMode: true,
      gdprConsent: 'gdprConsent',
      usPrivacyString: 'usPrivacyString'
    }, calls)
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
    const identityResolver = IdentityResolver.makeNoCache({}, calls)
    const errorCallback = (error) => {
      expect(error.message).to.be.eq('Incorrect status received : 500')
      done()
    }
    identityResolver.resolve(() => undefined, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should allow resolving custom attributes', function (done) {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.makeNoCache(
      {
        identityResolutionConfig: {
          requestedAttributes: ['uid2', 'md5']
        }
      },
      calls
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
    const identityResolver = IdentityResolver.makeNoCache(
      {
        identityResolutionConfig: {
          requestedAttributes: ['uid2', 'md5']
        },
        privacyMode: true
      },
      calls
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
})
