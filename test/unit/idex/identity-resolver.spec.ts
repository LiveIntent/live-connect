// @ts-nocheck

import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver, ResolutionMetadata } from '../../../src/idex'
import { DefaultCallHandler } from 'live-connect-handlers'
import { LocalEventBus } from '../../../src/events/event-bus'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('IdentityResolver without cache', () => {
  let requestToComplete = null
  const eventBus = LocalEventBus()
  const calls = new DefaultCallHandler()
  let errors = []
  let callCount = 0

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

  it('should invoke callback on success', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({}, calls, eventBus)
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

  it('should attach the duid', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({ peopleVerifiedId: '987' }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?duid=987')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach the cookie domain', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({ cookieDomain: '.abc.xyz.com' }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?cd=.abc.xyz.com')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach additional params', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({ peopleVerifiedId: '987' }, calls)
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
    const identityResolver = new IdentityResolver({ peopleVerifiedId: '987' }, calls)
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
    const identityResolver = new IdentityResolver({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/123?duid=987&key=value')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback, () => undefined, { key: 'value' })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', (done) => {
    const identityResolver = new IdentityResolver({ peopleVerifiedId: null }, calls)
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
    const identityResolver = new IdentityResolver({
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

  it('should attach us_privacy', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({
      usPrivacyString: 'us,Privacy,String'
    }, calls)
    const successCallback = (responseAsJson: unknown) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?us_privacy=us%2CPrivacy%2CString')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach gdpr and gdpr_consent', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({
      gdprApplies: false,
      gdprConsent: 'gdpr,Consent'
    }, calls)
    const successCallback = (responseAsJson: unknown) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?gdpr=0&gdpr_consent=gdpr%2CConsent')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach gpp_s and gpp_as', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({
      gppString: 'gpp,String',
      gppApplicableSections: [1, 2, 3]
    }, calls)
    const successCallback = (responseAsJson: unknown) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?gpp_s=gpp%2CString&gpp_as=1%2C2%2C3')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should attach n3pc when in privacy mode', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver({
      privacyMode: true,
      distributorId: 'did-0001'
    }, calls)
    const successCallback = (responseAsJson: unknown) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?n3pc=1&did=did-0001')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should return the default empty response and emit error if response is 500', (done) => {
    const identityResolver = new IdentityResolver({}, calls)
    const errorCallback = (error) => {
      expect(error.message).to.match(/^Error during XHR call: 500, url:/)
      done()
    }
    identityResolver.resolve(() => undefined, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should allow resolving custom attributes', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver(
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

  it('should not resolve uid2 when privacy mode is enabled', (done) => {
    const response = { id: 112233 }
    const identityResolver = new IdentityResolver(
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

  it('should expose expires header from the server', (done) => {
    const response = { id: 112233 }

    const identityResolver = new IdentityResolver({}, calls, eventBus)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    function epochSeconds(date: Date) {
      Math.floor(date.getTime() / 1000)
    }

    const successCallback = (responseAsJson: unknown, meta: ResolutionMetadata) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)

      expect(epochSeconds(meta.expiresAt!)).to.be.eq(epochSeconds(expiresAt))

      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(
      200,
      { 'Content-Type': 'application/json', Expires: expiresAt.toUTCString() },
      JSON.stringify(response)
    )
  })

  it('should resolve the idcookie', (done) => {
    const value = 'foo'
    const identityResolver = new IdentityResolver({ resolvedIdCookie: value, identityResolutionConfig: { requestedAttributes: ['idcookie'] } }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql({ idcookie: value })
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({}))
  })

  it('should resolve the idcookie when requested via additional attributes', (done) => {
    const value = 'foo'
    const identityResolver = new IdentityResolver({ resolvedIdCookie: value }, calls)
    const successCallback = (responseAsJson) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql({ idcookie: value })
      done()
    }
    identityResolver.resolve(successCallback, () => {}, { resolve: ['idcookie'] })
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({}))
  })

  it('should include the idcookie in the url if the mode is provided', () => {
    const value = 'foo'
    const identityResolver = new IdentityResolver({ resolvedIdCookie: value, idCookie: { mode: 'provided' } }, calls)

    expect(identityResolver.getUrl({})).to.eq('https://idx.liadm.com/idex/unknown/any?ic=acbd18db4cc2f85cedef654fccc4a4d8')
  })

  it('should not include the idcookie in the url if the mode is generated', () => {
    const value = 'foo'
    const identityResolver = new IdentityResolver({ resolvedIdCookie: value, idCookie: { mode: 'generated' } }, calls)

    expect(identityResolver.getUrl({})).to.eq('https://idx.liadm.com/idex/unknown/any')
  })
})
