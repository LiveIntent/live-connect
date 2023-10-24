import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { IdentityResolver } from '../../../src/idex'
import { DefaultStorageHandler, DefaultCallHandler } from 'live-connect-handlers'
import { LocalEventBus } from '../../../src/events/event-bus'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { WrappedCallHandler } from '../../../src/handlers/call-handler'
import { StorageHandlerBackedCache } from '../../../src/cache'

use(dirtyChai)

describe('IdentityResolver', () => {
  const sandbox = sinon.createSandbox()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let requestToComplete: any = null
  const eventBus = LocalEventBus()
  const calls = new WrappedCallHandler(new DefaultCallHandler(), eventBus)
  const storage = new DefaultStorageHandler(eventBus)
  let errors: string[] = []
  let callCount = 0
  const storageHandler = WrappedStorageHandler.make('cookie', new DefaultStorageHandler(eventBus), eventBus)
  const cache = new StorageHandlerBackedCache({
    eventBus,
    storageHandler,
    cookieDomain: 'example.com'
  })

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.something.example.com'
    })

    eventBus.on('li_errors', error => errors.push(error as string))
    // @ts-ignore
    global.XDomainRequest = null
    // @ts-ignore
    global.XMLHttpRequest = sinon.createSandbox().useFakeXMLHttpRequest()
    // @ts-ignore
    global.XMLHttpRequest.onCreate = request => {
      requestToComplete = request
      callCount += 1
    }
    callCount = 0
    errors = []
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should invoke callback on success, store the result in a cookie', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({}, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)
      expect(storageHandler.getCookie('__li_idex_cache2_InVua25vd24vYW55Ig')).to.be.eq(JSON.stringify(response))
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should cache response even if one backend fails', () => {
    sandbox.stub(storage, 'setCookie').throws()

    const failedStorage = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      eventBus,
      storageHandler: failedStorage,
      cookieDomain: 'example.com'
    })
    const identityResolver = IdentityResolver.make({}, cache, calls, eventBus)
    let jsonResponse = null
    const successCallback = (responseAsJson: unknown) => {
      jsonResponse = responseAsJson
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 321 }))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
    expect(jsonResponse).to.be.eql({ id: 321 })

    identityResolver.resolve(successCallback)
    expect(jsonResponse).to.be.eql({ id: 321 })
    expect(errors).to.not.be.empty()
    expect(callCount).to.be.eql(1)
  })

  it('should invoke callback on success, if storing the result in a either backend fails', () => {
    sandbox.stub(storage, 'setCookie').throws()
    sandbox.stub(storage, 'setDataInLocalStorage').throws()

    const failedStorage = WrappedStorageHandler.make('cookie', storage, eventBus)
    const cache = new StorageHandlerBackedCache({
      eventBus,
      storageHandler: failedStorage,
      cookieDomain: 'example.com'
    })
    const identityResolver = IdentityResolver.make({}, cache, calls, eventBus)
    let jsonResponse = null
    const successCallback = (responseAsJson: unknown) => {
      jsonResponse = responseAsJson
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 321 }))
    expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
    expect(jsonResponse).to.be.eql({ id: 321 })

    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 123 }))
    expect(jsonResponse).to.be.eql({ id: 123 })
    expect(errors).to.not.be.empty()
    expect(callCount).to.be.eql(2)
  })

  it('should attach the duid', (done) => {
    const response = { id: 112233 }
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987' }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: '987', identityResolutionConfig: { publisherId: 123 } }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    const identityResolver = IdentityResolver.make({ distributorId: 'did-01er' }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any?did=did-01er')
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      done()
    }
    identityResolver.resolve(successCallback)
    requestToComplete.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
  })

  it('should not attach an empty tuple', (done) => {
    const identityResolver = IdentityResolver.make({ peopleVerifiedId: undefined }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    }, cache, calls, eventBus)
    const successCallback = (responseAsJson: unknown) => {
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
    const identityResolver = IdentityResolver.make({
      usPrivacyString: 'us,Privacy,String'
    }, cache, calls, eventBus)
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
    const identityResolver = IdentityResolver.make({
      gdprApplies: false,
      gdprConsent: 'gdpr,Consent'
    }, cache, calls, eventBus)
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
    const identityResolver = IdentityResolver.make({
      gppString: 'gpp,String',
      gppApplicableSections: [1, 2, 3]
    }, cache, calls, eventBus)
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
    const identityResolver = IdentityResolver.make({
      privacyMode: true,
      distributorId: 'did-0001'
    }, cache, calls, eventBus)
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
    const identityResolver = IdentityResolver.make({}, cache, calls, eventBus)
    const errorCallback = (error: unknown) => {
      expect((error as Error).message).to.match(/^Error during XHR call: 500, url/)
      done()
    }
    identityResolver.resolve(() => undefined, errorCallback)
    requestToComplete.respond(500, { 'Content-Type': 'application/json' }, 'i pitty the foo')
  })

  it('should return different responses for different additional params', () => {
    const responseMd5 = { id: 123 }
    const responseSha1 = { id: 125 }

    const identityResolver = IdentityResolver.make({}, cache, calls, eventBus)
    let jsonResponse = null
    const successCallback = (responseAsJson: unknown) => {
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
      cache,
      calls,
      eventBus
    )
    const successCallback = (responseAsJson: unknown) => {
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
      cache,
      calls,
      eventBus
    )
    const successCallback = (responseAsJson: unknown) => {
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
    let recordedExpiresAt: Date | undefined

    const customCache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      cookieDomain: 'example.com'
    })
    customCache.set = (key, value, expiresAt) => {
      recordedExpiresAt = expiresAt
      cache.set(key, value, expiresAt)
    }

    const identityResolver = IdentityResolver.make({}, customCache, calls, eventBus)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    function epochSeconds(date: Date) {
      Math.floor(date.getTime() / 1000)
    }

    const successCallback = (responseAsJson: unknown) => {
      expect(callCount).to.be.eql(1)
      expect(errors).to.be.empty()
      expect(responseAsJson).to.be.eql(response)
      expect(requestToComplete.url).to.eq('https://idx.liadm.com/idex/unknown/any')
      expect(responseAsJson).to.be.eql(response)
      expect(callCount).to.be.eql(1)

      expect(storageHandler.getCookie('__li_idex_cache2_InVua25vd24vYW55Ig')).to.be.eq(JSON.stringify(response))
      expect(epochSeconds(recordedExpiresAt!)).to.be.eq(epochSeconds(expiresAt))

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
