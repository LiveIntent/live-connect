import { expect } from 'chai'
import * as decisions from '../../../src/manager/decisions'
import * as storage from '../../../src/utils/storage'
import uuid from 'tiny-uuid4'
import sinon from 'sinon'
import jsdom from 'mocha-jsdom'

describe('DecisionsManager for stored decisions', () => {
  const sandbox = sinon.createSandbox()

  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  it('should return an empty string is nothing is in the cookie jar', function () {
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return an empty string is the cookie jar has invalid uuids', function () {
    storage.setCookie('lidids.', '2134')
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return the stored decision', function () {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId)
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should not return empty values', function () {
    storage.setCookie('lidids.', '')
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult.decisionIds.length).to.eql(0)
  })

  it('should return unique decision ids', function () {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId, { domain: 'something.example.com' })
    storage.setCookie('lidids.123', decisionId, { domain: 'www.something.example.com' })
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should emit an error if decisions.resolve fails for some reason, return an empty object', function () {
    const stub = sandbox.stub(storage, 'findSimilarCookies').throws()
    const resolutionResult = decisions.resolve({}, storage)
    expect(resolutionResult).to.eql({})
    stub.restore()
  })
})

describe('DecisionsManager for new decisions', () => {
  jsdom({
    url: 'http://subdomain.tests.example.com',
    useEach: true
  })

  it('should return the new decision id, and store it', function () {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should return the new decision id, and store it', function () {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should not return the new decision id if its not a uuid', function () {
    const decisionId = `${uuid()}sometghing`
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should combine the new cookie and the stored one', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=    ${decisionIdTwo}` }, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
  })

  it('should combine the new cookies and the stored one', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` }, storage)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
    expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
  })
})
