import { expect } from 'chai'
import * as identifiersEnricher from '../../../src/enrichers/identifiers'
import jsdom from 'mocha-jsdom'
import * as storage from '../../../src/utils/storage'
import sinon from 'sinon'

const COOKIE_NAME = 'sample_cookie'
const SIMPLE_COOKIE1 = 'sample_value1'
const SIMPLE_COOKIE2 = 'sample_value2'
const EMAIL = 'sample@liveintent.com'
const EMAIL_HASHES = {
  md5: 'eb2684ead8e942b6c4dc7465de66460c',
  sha1: '51d8351892cf317ba9924e8548339039bd28bc73',
  sha256: 'eb274de5c9e88e9388f1a57529c8b13f9245be1d921269fc6aa69ef78b004a9d'
}
const EMAIL2 = 'sample2@liveintent.com'
const EMAIL2_HASHES = {
  md5: '75524519292e51ad6f761baa82d07d76',
  sha1: 'ec3685d99c376b4ee14a5b985a05fc23e21235cb',
  sha256: 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72'
}

describe('IdentifiersEnricher', () => {
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.example.com/?sad=0&dsad=iou'
  })

  afterEach(() => {
    storage.setCookie(COOKIE_NAME, '')
    storage.removeDataFromLocalStorage(COOKIE_NAME)
  })

  it('should return an empty result when the collecting identifiers config is not set', function () {
    const state = {}
    const result = identifiersEnricher.enrich(state, storage)
    expect(result).to.eql({
      retrievedIdentifiers: [],
      hashesFromIdentifiers: []
    })
  })

  it('should return an empty result when the collecting identifiers config is set but there are no cookies', function () {
    const state = { identifiersToResolve: [COOKIE_NAME] }
    const result = identifiersEnricher.enrich(state, storage)
    expect(result).to.eql({
      retrievedIdentifiers: [],
      hashesFromIdentifiers: []
    })
  })

  it('should return the collected cookies when the identifiers config is a string', function () {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: `random_name,  ${COOKIE_NAME}  ` }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }],
      hashesFromIdentifiers: []
    })
  })

  it('should return the collected cookies', function () {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }],
      hashesFromIdentifiers: []
    })
  })

  it('should return the collected identifiers from local storage ', function () {
    storage.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE2
      }],
      hashesFromIdentifiers: []
    })
  })

  it('should prefer the cookie storage to the local storage', function () {
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    storage.setDataInLocalStorage(COOKIE_NAME, SIMPLE_COOKIE2)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: SIMPLE_COOKIE1
      }],
      hashesFromIdentifiers: []
    })
  })

  it('should return hashes when the cookie is an email', function () {
    storage.setCookie(COOKIE_NAME, EMAIL)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: EMAIL_HASHES.md5
      }],
      hashesFromIdentifiers: [EMAIL_HASHES]
    })
  })

  it('should return hashes when the cookie is a json with an email', function () {
    storage.setCookie(COOKIE_NAME, `"username":"${EMAIL}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: `"username":"${EMAIL_HASHES.md5}"`
      }],
      hashesFromIdentifiers: [EMAIL_HASHES]
    })
  })

  it('should return multiple hashes when the cookie is a json with an email', function () {
    storage.setCookie(COOKIE_NAME, `"username":"${EMAIL}","username2":"${EMAIL2}"`)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [{
        name: COOKIE_NAME,
        value: `"username":"${EMAIL_HASHES.md5}","username2":"${EMAIL2_HASHES.md5}"`
      }],
      hashesFromIdentifiers: [EMAIL_HASHES, EMAIL2_HASHES]
    })
  })

  it('should return cookies and deduplicated hashes', function () {
    const COOKIE2_NAME = `${COOKIE_NAME}2`
    storage.setCookie(COOKIE_NAME, `"username":"${EMAIL}"`)
    storage.setDataInLocalStorage(COOKIE2_NAME, EMAIL)
    const state = { identifiersToResolve: [COOKIE_NAME, COOKIE2_NAME] }

    const result = identifiersEnricher.enrich(state, storage)

    expect(result).to.eql({
      retrievedIdentifiers: [
        {
          name: COOKIE_NAME,
          value: `"username":"${EMAIL_HASHES.md5}"`
        },
        {
          name: COOKIE2_NAME,
          value: EMAIL_HASHES.md5
        }
      ],
      hashesFromIdentifiers: [EMAIL_HASHES]
    })
  })

  it('should emit an error and emit an empty result if cookies enrichment fails', function () {
    const getCookieStub = sandbox.stub(storage, 'getCookie').throws()
    storage.setCookie(COOKIE_NAME, SIMPLE_COOKIE1)
    const state = { identifiersToResolve: [COOKIE_NAME] }

    const resolutionResult = identifiersEnricher.enrich(state, storage)

    expect(resolutionResult).to.eql({})
    getCookieStub.restore()
  })

})
