import { expect } from 'chai'
import * as serverUtil from './helpers/mock-server'
import {
  deleteAllCookies,
  fetchResolvedIdentity,
  resolveIdentity
} from './helpers/browser'

const COOKIE_TO_SCRAPE_NAME = 'cookie_to_scrape'

describe('Minimal Standard LiveConnect', function () {
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
    }, 'minimal')
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

  it('should send and receive results of IdentityResolution', function () {
    server.openPage('bln.test.liveintent.com', 'page')
    resolveIdentity(1, server)
    const idexRequests = server.getIdexHistory()
    expect(idexRequests).to.not.be.empty
    const idexValue = fetchResolvedIdentity()
    expect(idexValue).to.eq(JSON.stringify({ unifiedId: 'some-id' }))
  })
})
