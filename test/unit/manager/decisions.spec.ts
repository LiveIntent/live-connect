import { expect, use } from 'chai'
import * as decisions from '../../../src/manager/decisions'
import { DefaultStorageHandler } from 'live-connect-handlers'
// @ts-expect-error
import uuid from 'tiny-uuid4'
import sinon from 'sinon'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'

use(dirtyChai)

const eventBus = LocalEventBus()
const externalStorage = new DefaultStorageHandler(eventBus)
const storage = WrappedStorageHandler.make('cookie', externalStorage, eventBus)

describe('DecisionsManager for stored decisions', () => {
  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.something.example.com'
    })
  })

  it('should return an empty string is nothing is in the cookie jar', () => {
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return an empty string is the cookie jar has invalid uuids', () => {
    storage.setCookie('lidids.', '2134')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return the stored decision', () => {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId)
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should not return empty values', () => {
    storage.setCookie('lidids.', '')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    // @ts-expect-error
    expect(resolutionResult.decisionIds.length).to.eql(0)
  })

  it('should return unique decision ids', () => {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'something.example.com')
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'www.something.example.com')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should emit an error if decisions.resolve fails for some reason, return an empty object', () => {
    const stub = sandbox.stub(storage, 'findSimilarCookies').throws()
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult).to.eql({})
    stub.restore()
  })
})

describe('DecisionsManager for new decisions', () => {
  beforeEach(() => {
    jsdom('', {
      url: 'http://subdomain.tests.example.com'
    })
  })

  it('should return the new decision id, and store it', () => {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should return the new decision id, and store it', () => {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should not return the new decision id if its not a uuid', () => {
    const decisionId = `${uuid()}sometghing`
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should combine the new cookie and the stored one', () => {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=    ${decisionIdTwo}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
  })

  it('should combine the new cookies and the stored one', () => {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
    expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
  })
})
