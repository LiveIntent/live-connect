import { assert, expect } from 'chai'
import * as serverUtil from './helpers/mock-server'
import {
  deleteAllCookies,
  probeLS,
  sendEvent,
  sendEventInIframe,
  resolveIdentity,
  fetchResolvedIdentity
} from './helpers/browser'

const packageJson = require('../../package')
const COOKIE_TO_SCRAPE_NAME = 'cookie_to_scrape'

describe('LiveConnect', function () {
  this.retries(4)
  let server

  before(function () {
    server = serverUtil.MockServerFactory({
      collectorUrl: 'http://bln.test.liveintent.com:3001',
      identifiersToResolve: [COOKIE_TO_SCRAPE_NAME],
      identityResolutionConfig: {
        url: 'http://me.idex.com:3001/idex',
        ajaxTimeout: 1000
      }
    })
  })

  beforeEach(function () {
    console.log('\x1b[35m\x1b[4m%s\x1b[0m', `##### Starting the test: '${this.currentTest.fullTitle()}'`)
  })

  afterEach(function () {
    server.clearHistory()
    deleteAllCookies()
    console.log('\x1b[35m\x1b[4m%s\x1b[0m', `##### Finishing the test: '${this.currentTest.fullTitle()}'`)
  })

  after(function () {
    server.stop()
  })

  it('should send decisionIds', function () {
    const decisionIdOne = '4ca76883-1e26-3fb8-b6d1-f881ac7d6699'
    const decisionIdTwo = '5ca76883-1e26-3fb8-b6d1-f881ac7d6699'
    const supportsLS = probeLS()
    server.openPage('bln.test.liveintent.com', `page?li_did=${decisionIdOne}`)

    sendEvent({}, supportsLS ? 1 : 2, server)
    const firstTrackingRequest = server.getTrackingRequests()[0]
    expect(decisionIdOne).to.eq(firstTrackingRequest['query']['li_did'])

    server.clearHistory()
    server.openPage('bln.test.liveintent.com', `page?li_did=${decisionIdTwo}`)
    sendEvent({}, supportsLS ? 1 : 2, server)
    const secondTrackingRequest = server.getTrackingRequests()[0]
    expect(`${decisionIdTwo},${decisionIdOne}`).to.eq(secondTrackingRequest['query']['li_did'])
  })

  it('should send and receive results of IdentityResolution', function () {
    server.openPage('bln.test.liveintent.com', 'page')
    resolveIdentity(1, server)
    const idexRequests = server.getIdexHistory()
    expect(idexRequests).to.not.be.empty
    const idexValue = fetchResolvedIdentity()
    expect(idexValue).to.eq(JSON.stringify({ unifiedId: 'some-id' }))
  })

  it('should send http request to pixel endpoint, and reuse cookies across subdomains', function () {
    server.openPage('bln.test.liveintent.com', 'page?li_did=something')
    const supportsLS = probeLS()
    const expectedRequests = supportsLS ? 1 : 2
    sendEvent({}, expectedRequests, server)
    const trackingRequests = server.getTrackingRequests()
    const cookies = browser.getCookies()
    const tldCookie = cookies.filter(c => c.name === '_li_dcdm_c')[0].value
    const fpcCookie = cookies.filter(c => c.name === '_lc2_fpi')[0].value
    assert.strictEqual(trackingRequests.length, 1)
    expect(tldCookie).to.eql('.liveintent.com')
    expect(fpcCookie).to.eql(trackingRequests[0]['query']['duid'])
    expect(`${packageJson.versionPrefix}${packageJson.version}`).to.eq(trackingRequests[0]['query']['tna'])

    server.clearHistory()
    server.openPage('test.liveintent.com', 'page')
    sendEvent({}, expectedRequests, server)
    const newTrackingRequests = server.getTrackingRequests()
    const newCookies = browser.getCookies()
    const newTldCookie = newCookies.filter(c => c.name === '_li_dcdm_c')[0].value
    const newFpcCookie = newCookies.filter(c => c.name === '_lc2_fpi')[0].value
    assert.strictEqual(newTrackingRequests.length, 1)
    expect(tldCookie).to.eql(newTldCookie)
    expect(fpcCookie).to.eql(newFpcCookie)
    expect(newFpcCookie).to.eql(newTrackingRequests[0]['query']['duid'])

    if (!supportsLS) {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 1)
      expect(applicationErrors[0]['query']['ae']).to.not.be.empty
    }
  })

  it('should send http request to pixel endpoint with scraped cookies and hashes', function () {
    const cookie = {
      name: COOKIE_TO_SCRAPE_NAME,
      value: 'sample@liveintent.com'
    }
    const hashes = {
      md5: 'eb2684ead8e942b6c4dc7465de66460c',
      sha1: '51d8351892cf317ba9924e8548339039bd28bc73',
      sha256: 'eb274de5c9e88e9388f1a57529c8b13f9245be1d921269fc6aa69ef78b004a9d'
    }

    server.openPage('bln.test.liveintent.com', 'page')
    const supportsLS = probeLS()
    browser.setCookies(cookie)
    server.openPage('bln.test.liveintent.com', 'page')
    sendEvent({}, supportsLS ? 1 : 2, server)

    if (supportsLS) {
      const trackingRequests = server.getTrackingRequests()
      assert.strictEqual(trackingRequests.length, 1)
      expect(hashes.md5).to.eq(trackingRequests[0]['query'][`ext_${COOKIE_TO_SCRAPE_NAME}`])
      expect(`${hashes.md5},${hashes.sha1},${hashes.sha256}`).to.eq(trackingRequests[0]['query']['scre'])
    } else {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 2)
      expect(applicationErrors[0]['query']['ae']).to.not.be.empty
      expect(applicationErrors[1]['query']['ae']).to.not.be.empty
    }
  })

  it('should prepend duid cookie with hashed apex domain', function () {
    server.openPage('bln.test.liveintent.com', 'framed')
    sendEventInIframe({}, 1, server)

    if (probeLS()) {
      const trackingRequests = server.getTrackingRequests()
      assert.strictEqual(trackingRequests.length, 1)
      expect(trackingRequests[0]['query']['duid']).to.match(/c8873205d21e--.*/) // hash(.liveintent.com)--ulid
    } else {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 1)
      expect(applicationErrors[0]['query']['ae']).to.not.be.empty
    }
  })
})
