// @ts-nocheck

import { assert, expect, use } from 'chai'
import * as serverUtil from './helpers/mock-server.ts'
import {
  deleteAllCookies,
  fetchResolvedIdentity,
  isFirefox,
  isFirefoxAfter86,
  isIE,
  isMobileSafari,
  isMobileSafari14OrNewer,
  probeLS,
  resolveIdentity,
  sendEvent,
  waitForBakerRequests,
  waitForRequests
} from './helpers/browser.ts'
import dirtyChai from 'dirty-chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' }))

use(dirtyChai)

const COOKIE_TO_SCRAPE_NAME = 'cookie_to_scrape'

describe('LiveConnect', function () {
  this.retries(5)
  let server
  let supportsLS

  before(async function () {
    server = serverUtil.MockServerFactory({
      collectorUrl: 'http://bln.test.liveintent.com:3001',
      identifiersToResolve: [COOKIE_TO_SCRAPE_NAME],
      identityResolutionConfig: {
        url: 'http://me.idex.com:3001/idex',
        ajaxTimeout: 3000
      }
    })
    // wait for environment to become ready
    await server.openPage('bln.test.liveintent.com', 'empty')

    supportsLS = await probeLS()
  })

  beforeEach(function () {
    console.log('\x1b[35m\x1b[4m%s\x1b[0m', `##### Starting the test: '${this.currentTest.fullTitle()}'`)
  })

  afterEach(async function () {
    server.clearHistory()
    await deleteAllCookies()
    console.log('\x1b[35m\x1b[4m%s\x1b[0m', `##### Finishing the test: '${this.currentTest.fullTitle()}'`)
  })

  after(() => server.stop())

  it('should send decisionIds', async function () {
    const decisionIdOne = '4ca76883-1e26-3fb8-b6d1-f881ac7d6699'
    const decisionIdTwo = '5ca76883-1e26-3fb8-b6d1-f881ac7d6699'
    await server.openPage('bln.test.liveintent.com', `page?li_did=${decisionIdOne}`)
    await sendEvent({}, supportsLS ? 1 : 2, server)
    const firstTrackingRequest = server.getTrackingRequests()[0]
    expect(decisionIdOne).to.eq(firstTrackingRequest.query.li_did)

    server.clearHistory()
    await server.openPage('bln.test.liveintent.com', `page?li_did=${decisionIdTwo}`)
    await sendEvent({}, supportsLS ? 1 : 2, server)
    const secondTrackingRequest = server.getTrackingRequests()[0]
    expect(`${decisionIdTwo},${decisionIdOne}`).to.eq(secondTrackingRequest.query.li_did)
  })

  it('should send and receive results of IdentityResolution', async function () {
    await server.openPage('bln.test.liveintent.com', 'page')
    await resolveIdentity(1, server)
    const idexRequests = server.getIdexHistory()
    expect(idexRequests).to.not.be.empty()
    const idexValue = await fetchResolvedIdentity()
    expect(idexValue).to.eq(JSON.stringify({ unifiedId: 'some-id' }))
  })

  it('should send http request to pixel endpoint, and reuse cookies across subdomains', async function () {
    await server.openPage('bln.test.liveintent.com', 'page?li_did=something')
    const expectedRequests = supportsLS ? 1 : 2
    await sendEvent({}, expectedRequests, server)
    const trackingRequests = server.getTrackingRequests()
    const cookies = await browser.getCookies()
    const tldCookie = cookies.filter(c => c.name === '_li_dcdm_c')[0].value
    const fpcCookie = cookies.filter(c => c.name === '_lc2_fpi')[0].value
    assert.strictEqual(trackingRequests.length, 1)
    expect(tldCookie).to.eql('.liveintent.com')
    expect(fpcCookie).to.eql(trackingRequests[0].query.duid)
    expect(trackingRequests[0].query.tna).to.eq(`${packageJson.versionPrefix}${packageJson.version}`)

    server.clearHistory()
    await server.openPage('test.liveintent.com', 'page')
    await sendEvent({}, expectedRequests, server)
    const newTrackingRequests = server.getTrackingRequests()
    const newCookies = await browser.getCookies()
    const newTldCookie = newCookies.filter(c => c.name === '_li_dcdm_c')[0].value
    const newFpcCookie = newCookies.filter(c => c.name === '_lc2_fpi')[0].value
    assert.strictEqual(newTrackingRequests.length, 1)
    expect(tldCookie).to.eql(newTldCookie)
    expect(fpcCookie).to.eql(newFpcCookie)
    expect(newFpcCookie).to.eql(newTrackingRequests[0].query.duid)

    if (!supportsLS) {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 1)
      expect(applicationErrors[0].query.ae).to.not.be.empty()
    }
  })

  it('should send http request to pixel endpoint with scraped cookies and hashes', async function () {
    const cookie = {
      name: COOKIE_TO_SCRAPE_NAME,
      value: 'sample@liveintent.com'
    }
    const hashes = {
      md5: 'eb2684ead8e942b6c4dc7465de66460c',
      sha1: '51d8351892cf317ba9924e8548339039bd28bc73',
      sha256: 'eb274de5c9e88e9388f1a57529c8b13f9245be1d921269fc6aa69ef78b004a9d'
    }

    await server.openPage('bln.test.liveintent.com', 'page')
    await browser.setCookies(cookie)
    await server.openPage('bln.test.liveintent.com', 'page')
    await sendEvent({}, supportsLS ? 1 : 2, server)

    if (supportsLS) {
      const trackingRequests = server.getTrackingRequests()
      assert.strictEqual(trackingRequests.length, 1)
      expect(hashes.md5).to.eq(trackingRequests[0].query[`ext_${COOKIE_TO_SCRAPE_NAME}`])
      expect(`${hashes.md5},${hashes.sha1},${hashes.sha256}`).to.eq(trackingRequests[0].query.scre)
    } else {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 2)
      expect(applicationErrors[0].query.ae).to.not.be.empty()
      expect(applicationErrors[1].query.ae).to.not.be.empty()
    }
  })

  it('should prepend duid cookie with hashed apex domain', async function () {
    await server.openPage('bln.test.liveintent.com', 'framed')
    await waitForRequests(supportsLS ? 1 : 2, server)

    if (supportsLS) {
      const trackingRequests = server.getTrackingRequests()
      assert.strictEqual(trackingRequests.length, 1)
      expect(trackingRequests[0].query.duid).to.match(/c8873205d21e--.*/) // hash(.liveintent.com)--ulid
    } else {
      const applicationErrors = server.getApplicationErrors()
      assert.strictEqual(applicationErrors.length, 1)
      expect(applicationErrors[0].query.ae).to.not.be.empty()
    }
  })

  // - Main page http://bln.test.liveintent.com:3001/self-triggering-page
  it('should send only the page url when the tracker is in the top window and there is no referrer', async function () {
    await server.openPage('bln.test.liveintent.com', 'page')
    await sendEvent({}, supportsLS ? 1 : 2, server)

    const firstTrackingRequest = server.getTrackingRequests()[0]
    if (!isMobileSafari()) {
      expect(firstTrackingRequest.query.refr).to.be.undefined()
    }
    expect('http://bln.test.liveintent.com:3001/page').to.eq(firstTrackingRequest.query.pu)
  })

  // - Referrer http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/self-triggering-page
  // ---->
  // - Main page http://bln.test.liveintent.com:3001/self-triggering-page
  it('should send the referrer and the page url when the tracker is in the top window', async function () {
    await server.openUriViaReferrer('schmoogle.com', 'bln.test.liveintent.com', 'self-triggering-page')
    await waitForRequests(supportsLS ? 1 : 2, server)

    const firstTrackingRequest = server.getTrackingRequests()[0]
    if (isMobileSafari14OrNewer()) {
      expect(firstTrackingRequest.query.refr).to.match(/http:\/\/schmoogle.com:3001.*/)
    } else {
      expect('http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/self-triggering-page').to.eq(firstTrackingRequest.query.refr)
    }
    expect('http://bln.test.liveintent.com:3001/self-triggering-page').to.eq(firstTrackingRequest.query.pu)
  })

  // - Referrer http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/framed
  // ---->
  // - Main page http://bln.test.liveintent.com:3001/framed
  // - - Iframe1 http://bln.test.liveintent.com:3001/self-triggering-page
  it('should send the referrer and the page url when the tracker is in the iframe', async function () {
    await server.openUriViaReferrer('schmoogle.com', 'bln.test.liveintent.com', 'framed')
    await waitForRequests(supportsLS ? 1 : 2, server)

    const firstTrackingRequest = server.getTrackingRequests()[0]
    if (isMobileSafari14OrNewer()) {
      expect(firstTrackingRequest.query.refr).to.match(/http:\/\/schmoogle.com:3001.*/)
    } else {
      expect('http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/framed').to.eq(firstTrackingRequest.query.refr)
    }
    expect('http://bln.test.liveintent.com:3001/framed').to.eq(firstTrackingRequest.query.pu)
  })

  // - Referrer http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/double-framed
  // ---->
  // - Main page http://bln.test.liveintent.com:3001/double-framed
  // - - Iframe1 http://framed.test.liveintent.com:3001/framed
  // - - - Iframe2 http://bln.test.liveintent.com:3001/self-triggering-page
  it('should send the referrer and the page url when the tracker is in the nested iframe', async function () {
    await server.openUriViaReferrer('schmoogle.com', 'bln.test.liveintent.com', 'double-framed')
    await waitForRequests(supportsLS ? 1 : 2, server)

    const firstTrackingRequest = server.getTrackingRequests()[0]
    if (isMobileSafari14OrNewer()) {
      expect(firstTrackingRequest.query.refr).to.match(/http:\/\/schmoogle.com:3001.*/)
    } else {
      expect('http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/double-framed').to.eq(firstTrackingRequest.query.refr)
    }
    expect('http://bln.test.liveintent.com:3001/double-framed').to.eq(firstTrackingRequest.query.pu)
  })

  // - Referrer http://schmoogle.com:3001/referrer?uri=http://bln.test.liveintent.com:3001/double-framed
  // ---->
  // - Main page http://double-framed.test.liveintent.com:3001/double-framed
  // - - Iframe1 http://framed.test.liveintent.com:3001/framed
  // - - - Iframe2 http://bln.test.liveintent.com:3001/self-triggering-page
  it('should send the referrer and the page url when the tracker is in the nested iframe and the iframe is cross-domain', async function () {
    await server.openUriViaReferrer('schmoogle.com', 'double-framed.test.liveintent.com', 'double-framed')
    await waitForRequests(supportsLS ? 1 : 2, server)

    const firstTrackingRequest = server.getTrackingRequests()[0]

    expect(firstTrackingRequest.query.refr).to.be.undefined()
    if (isFirefoxAfter86()) {
      expect('http://framed.test.liveintent.com:3001/').to.eq(firstTrackingRequest.query.pu)
    } else if (isIE() || isFirefox()) {
      expect('http://framed.test.liveintent.com:3001/framed').to.eq(firstTrackingRequest.query.pu)
    } else {
      expect('http://double-framed.test.liveintent.com:3001').to.eq(firstTrackingRequest.query.pu)
    }
  })

  it('should call the baker when the domain has a baker', async function () {
    await server.openPage('baked.liveintent.com', 'page')

    await sendEvent({}, supportsLS ? 1 : 2, server)
    await waitForBakerRequests(2, server)

    expect(server.getBakerHistory().length).to.eq(2)
  })

  it('should send the collected context elements from page', async function () {
    await server.openPage('bln.test.liveintent.com', 'elements')

    await sendEvent({}, supportsLS ? 1 : 2, server)

    // Base64('<p>To collect</p>') -> 'PHA-VG8gY29sbGVjdDwvcD4'
    const firstTrackingRequest = server.getTrackingRequests()[0]
    expect(firstTrackingRequest.query.c).to.eq('PHA-VG8gY29sbGVjdDwvcD4')
  })
})
