import { expect, use } from 'chai'
import * as decisions from '../../../src/manager/decisions'
import { DefaultStorageHandler } from 'live-connect-handlers'
import uuid from 'tiny-uuid4'
import sinon from 'sinon'
import jsdom from 'mocha-jsdom'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { withResource } from '../test-utils/with-resources'

use(dirtyChai)

let eventBus = LocalEventBus()
const externalStorage = new DefaultStorageHandler(eventBus)
const storage = WrappedStorageHandler.make('cookie', externalStorage, eventBus)

describe('DecisionsManager for stored decisions', () => {
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  it('should return an empty string if nothing is in the cookie jar', function () {
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return an empty string if the cookie jar has invalid uuids', function () {
    storage.setCookie('lidids.', '2134')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return the stored decision', function () {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId)
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should not return empty values', function () {
    storage.setCookie('lidids.', '')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds.length).to.eql(0)
  })

  it('should return unique decision ids', function () {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'something.example.com')
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'www.something.example.com')
    const resolutionResult = decisions.resolve({}, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })
})

describe('DecisionsManager for new decisions', () => {
  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    eventBus = LocalEventBus()
  })

  jsdom({
    url: 'http://subdomain.tests.example.com',
    useEach: true
  })

  it('should return the new decision id, and store it', function () {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should return the new decision id, and store it', function () {
    const decisionId = uuid()
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should not return the new decision id if its not a uuid', function () {
    const decisionId = `${uuid()}sometghing`
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should combine the new cookie and the stored one', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=    ${decisionIdTwo}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
  })

  it('should combine the new cookies and the stored one', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` }, storage, eventBus)
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
    expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
  })

  it('should return the new decision id if look up of stored decision ids fails', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const stub = sandbox.stub(storage, 'findSimilarCookies').throws()

    let errorEmitted = false
    eventBus.once('li_errors', () => { errorEmitted = true })

    withResource(
      stub,
      stub => stub.restore(),
      () => {
        expect(errorEmitted).to.eq(false)
        const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` }, storage, eventBus)
        expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree])
        expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
        expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
        expect(errorEmitted).to.eq(true)
      })
  })

  it('should return the new decision id and stored decision id if storing new decision id fails', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const stub = sandbox.stub(storage, 'setCookie').throws()

    let errorEmitted = false
    eventBus.once('li_errors', () => { errorEmitted = true })

    withResource(
      stub,
      stub => stub.restore(),
      () => {
        expect(errorEmitted).to.eq(false)
        const resolutionResult = decisions.resolve({ pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` }, storage, eventBus)
        expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
        expect(errorEmitted).to.eq(true)
      })
  })
})
