import { expect, use } from 'chai'
import { enrichIdentifiers } from '../../../src/enrichers/identifiers-nohash'
import jsdom from 'global-jsdom'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon from 'sinon'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'

use(dirtyChai)

const eventBus = LocalEventBus()
const storageHandler = WrappedStorageHandler.make('cookie', new DefaultStorageHandler(eventBus), eventBus)
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
    storageHandler.setCookie(COOKIE_NAME, '')
    storageHandler.removeDataFromLocalStorage(COOKIE_NAME)
  })

  it('should return an empty result when the collecting identifiers config is not set', () => {
    const result = enrichIdentifiers(storageHandler, eventBus)({ identifiersToResolve: [] })
    expect(result.retrievedIdentifiers).to.eql([])
  })

  it('should return an empty result when the collecting identifiers config is set but there are no cookies', () => {
    const result = enrichIdentifiers(storageHandler, eventBus)({ identifiersToResolve: [COOKIE_NAME] })
    expect(result.retrievedIdentifiers).to.eql([])
  })

  it('should return the collected cookies when the identifiers config is a string', () => {
    storageHandler.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: `random_name,  ${COOKIE_NAME}  ` }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([{
      name: COOKIE_NAME,
      value: SIMPLE_COOKIE1
    }])
  })

  it('should return the collected cookies', () => {
    storageHandler.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([{
      name: COOKIE_NAME,
      value: SIMPLE_COOKIE1
    }])
  })

  it('should return the collected identifiers from local storage ', () => {
    storageHandler.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([{
      name: COOKIE_NAME,
      value: SIMPLE_COOKIE2
    }])
  })

  it('should prefer the cookie storage to the local storage', () => {
    storageHandler.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    storageHandler.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([{
      name: COOKIE_NAME,
      value: SIMPLE_COOKIE1
    }])
  })

  it('should not return hashes when the cookie is an email', () => {
    storageHandler.setCookie(COOKIE_NAME, EMAIL)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([])
  })

  it('should not return hashes when the cookie is a json with an email', () => {
    storageHandler.setCookie(COOKIE_NAME, `"username":"${EMAIL}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([])
  })

  it('should not return multiple hashes when the cookie is a json with an email', () => {
    storageHandler.setCookie(COOKIE_NAME, `"username":"${EMAIL}","username2":"${EMAIL2}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(result.retrievedIdentifiers).to.eql([])
  })

  it('should emit an error and emit an empty result if cookies enrichment fails', () => {
    const getCookieStub = sandbox.stub(storageHandler, 'getCookie').throws()
    storageHandler.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const resolutionResult = enrichIdentifiers(storageHandler, eventBus)(state)

    expect(resolutionResult.retrievedIdentifiers).to.eql([])

    getCookieStub.restore()
  })
})
