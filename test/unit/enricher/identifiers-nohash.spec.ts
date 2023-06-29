import { expect, use } from 'chai'
import * as identifiersEnricher from '../../../src/enrichers/identifiers-nohash'
import jsdom from 'global-jsdom'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon from 'sinon'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'

use(dirtyChai)

const eventBus = LocalEventBus()
const storage = new DefaultStorageHandler(eventBus)
const COOKIE_NAME = 'sample_cookie'
const SIMPLE_COOKIE1 = 'sample_value1'
const SIMPLE_COOKIE2 = 'sample_value2'
const EMAIL = 'sample@liveintent.com'
const EMAIL2 = 'sample2@liveintent.com'

describe('IdentifiersNoHashEnricher', () => {
  const sandbox = sinon.createSandbox()
  beforeEach(() => jsdom('', {
    url: 'https://www.example.com/?sad=0&dsad=iou'
  }))

  afterEach(() => {
    storage.setCookie(COOKIE_NAME, '')
    storage.removeDataFromLocalStorage(COOKIE_NAME)
  })

  it('should return an empty result when the collecting identifiers config is not set', () => {
    const state = {}
    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)
    expect(result).to.eql({
      retrievedIdentifiers: []
    })
  })

  it('should return an empty result when the collecting identifiers config is set but there are no cookies', () => {
    const state = { identifiersToResolve: [COOKIE_NAME] }
    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)
    expect(result).to.eql({
      retrievedIdentifiers: []
    })
  })

  it('should return the collected cookies when the identifiers config is a string', () => {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: `random_name,  ${COOKIE_NAME}  ` }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }]
    })
  })

  it('should return the collected cookies', () => {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }]
    })
  })

  it('should return the collected identifiers from local storage ', () => {
    storage.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE2
      }]
    })
  })

  it('should prefer the cookie storage to the local storage', () => {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    storage.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }]
    })
  })

  it('should not return hashes when the cookie is an email', () => {
    storage.setCookie(COOKIE_NAME, EMAIL)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: []
    })
  })

  it('should not return hashes when the cookie is a json with an email', () => {
    storage.setCookie(COOKIE_NAME, `"username":"${EMAIL}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: []
    })
  })

  it('should not return multiple hashes when the cookie is a json with an email', () => {
    storage.setCookie(COOKIE_NAME, `"username":"${EMAIL}","username2":"${EMAIL2}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    // @ts-expect-error
    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: []
    })
  })

  it('should emit an error and emit an empty result if cookies enrichment fails', () => {
    const getCookieStub = sandbox.stub(storage, 'getCookie').throws()
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }
    // @ts-expect-error
    const resolutionResult = identifiersEnricher.enrich(state, storage, eventBus)

    expect(resolutionResult).to.eql({})
    getCookieStub.restore()
  })
})
